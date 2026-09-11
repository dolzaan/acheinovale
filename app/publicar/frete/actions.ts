"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { normalizeBrazilianPhone } from "@/lib/validation/profile";
import { createPublicCode, freighterSlug, slugify } from "@/lib/validation/listing";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createProfileImagePath,
  isSupportedProfileImage,
  PROFILE_IMAGE_MAX_BYTES,
  PROFILE_IMAGE_MIME_TYPES,
  profileImagePathFromPublicUrl,
  STORAGE_BUCKETS,
} from "@/lib/supabase/storage";

const VEHICLE_TYPES = new Set(["Utilitário", "Van", "Caminhão baú", "Caminhão carroceria", "Moto"]);

function field(data: FormData, name: string) {
  const value = data.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function optionalRadius(data: FormData) {
  const raw = field(data, "serviceRadiusKm");
  if (!raw) return { valid: true, value: null };
  const value = Number(raw);
  return Number.isInteger(value) && value >= 1 && value <= 500
    ? { valid: true, value }
    : { valid: false, value: null };
}

export async function saveFreighterProfile(formData: FormData) {
  const user = await requireCurrentUser("/publicar/frete");
  const rateLimit = await checkRateLimit({ scope: "publicar-frete", identifier: user.id, limit: 10, windowSeconds: 60 * 60 });
  if (!rateLimit.allowed) redirect("/publicar/frete?erro=limite");

  const displayName = field(formData, "displayName");
  const description = field(formData, "description");
  const cityId = field(formData, "cityId");
  const whatsapp = normalizeBrazilianPhone(field(formData, "whatsapp"));
  const priceNote = field(formData, "priceNote");
  const vehicleTypes = formData.getAll("vehicleTypes").filter((item): item is string => typeof item === "string" && VEHICLE_TYPES.has(item));
  const requestedServiceCityIds = [...new Set(formData.getAll("serviceCityIds").filter((item): item is string => typeof item === "string" && item.length <= 80))];
  const radius = optionalRadius(formData);
  const services = field(formData, "services")
    .split(",")
    .map(service => service.trim())
    .filter(Boolean);
  const serviceSlugs = services.map(slugify);
  const servicesAreValid =
    services.length >= 1 &&
    services.length <= 8 &&
    services.every(service => service.length >= 2 && service.length <= 80) &&
    serviceSlugs.every(Boolean) &&
    new Set(serviceSlugs).size === serviceSlugs.length;

  const [city, serviceCities] = await Promise.all([
    prisma.city.findFirst({ where: { id: cityId, isActive: true } }),
    prisma.city.findMany({ where: { id: { in: requestedServiceCityIds }, isActive: true }, select: { id: true, name: true, slug: true } }),
  ]);
  if (
    !city || !whatsapp || !radius.valid || !servicesAreValid ||
    displayName.length < 3 || displayName.length > 100 ||
    description.length < 30 || description.length > 2000 ||
    priceNote.length > 120 || vehicleTypes.length > 5 || serviceCities.length !== requestedServiceCityIds.length
  ) {
    redirect("/publicar/frete?erro=dados");
  }

  const photoField = formData.get("photo");
  const photo = photoField instanceof File && photoField.size > 0 ? photoField : null;
  let newImage: string | undefined;
  let uploadedPath: string | null = null;
  let admin: ReturnType<typeof createAdminClient> | null = null;

  if (photo) {
    if (!user.authUserId || photo.size > PROFILE_IMAGE_MAX_BYTES) redirect("/publicar/frete?erro=foto");
    const bytes = new Uint8Array(await photo.arrayBuffer());
    if (!isSupportedProfileImage(bytes, photo.type)) redirect("/publicar/frete?erro=foto");
    try {
      admin = createAdminClient();
      const { data: bucket } = await admin.storage.getBucket(STORAGE_BUCKETS.profiles);
      if (!bucket) {
        const { error } = await admin.storage.createBucket(STORAGE_BUCKETS.profiles, { public: true, fileSizeLimit: PROFILE_IMAGE_MAX_BYTES, allowedMimeTypes: [...PROFILE_IMAGE_MIME_TYPES] });
        if (error && !error.message.toLowerCase().includes("already")) throw error;
      }
      uploadedPath = createProfileImagePath(user.authUserId, photo.type);
      const { error } = await admin.storage.from(STORAGE_BUCKETS.profiles).upload(uploadedPath, bytes, { contentType: photo.type, cacheControl: "31536000", upsert: false });
      if (error) throw error;
      newImage = admin.storage.from(STORAGE_BUCKETS.profiles).getPublicUrl(uploadedPath).data.publicUrl;
    } catch (error) {
      console.error("[freteiro] Falha ao enviar foto.", { message: error instanceof Error ? error.message : String(error) });
      redirect("/publicar/frete?erro=foto");
    }
  }

  const existing = await prisma.freighterProfile.findUnique({ where: { userId: user.id } });
  try {
    await prisma.$transaction(async tx => {
      const slug = freighterSlug(displayName, city.name);
      const data = {
        slug,
        displayName,
        description,
        cityId,
        whatsapp,
        serviceRadiusKm: radius.value,
        priceNote: priceNote || null,
        availableToday: false,
        status: "PENDING" as const,
      };
      const profile = existing
        ? await tx.freighterProfile.update({ where: { id: existing.id }, data })
        : await tx.freighterProfile.create({ data: { ...data, publicCode: createPublicCode(), userId: user.id } });

      if (newImage) await tx.user.update({ where: { id: user.id }, data: { image: newImage } });
      await tx.freighterService.deleteMany({ where: { profileId: profile.id } });
      const structuredServices = [
        ...services.map((name, index) => ({ name, slug: serviceSlugs[index] })),
        ...vehicleTypes.map(name => ({ name: `Veículo: ${name}`, slug: `veiculo-${slugify(name)}` })),
        ...serviceCities.map(item => ({ name: `Atende: ${item.name}`, slug: `atende-${item.slug}` })),
      ];
      await tx.freighterService.createMany({ data: structuredServices.map(item => ({ profileId: profile.id, ...item })) });
    });
  } catch (error) {
    if (admin && uploadedPath) await admin.storage.from(STORAGE_BUCKETS.profiles).remove([uploadedPath]);
    throw error;
  }

  const previousImagePath = profileImagePathFromPublicUrl(user.image);
  if (admin && previousImagePath?.startsWith(`${user.authUserId}/profile/`) && previousImagePath !== uploadedPath) {
    const { error } = await admin.storage.from(STORAGE_BUCKETS.profiles).remove([previousImagePath]);
    if (error) console.warn("[freteiro] Não foi possível remover a foto anterior.", { message: error.message });
  }

  revalidatePath("/");
  revalidatePath("/freteiros");
  redirect("/meus-anuncios?criado=frete");
}
