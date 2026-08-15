"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  PROPERTY_IMAGE_LIMIT,
  PROPERTY_IMAGE_MAX_BYTES,
  PROPERTY_IMAGE_MIME_TYPES,
  PROPERTY_VIDEO_MAX_BYTES,
  PROPERTY_VIDEO_MIME_TYPES,
  STORAGE_BUCKETS,
} from "@/lib/supabase/storage";
import { normalizeBrazilianPhone } from "@/lib/validation/profile";
import { createPublicCode, parseMoneyToCents, propertySlug } from "@/lib/validation/listing";

function field(data: FormData, name: string) { const value = data.get(name); return typeof value === "string" ? value.trim() : ""; }

function parseImageKeys(value: string, authUserId: string) {
  try {
    const parsed: unknown = JSON.parse(value || "[]");
    if (!Array.isArray(parsed) || parsed.length > PROPERTY_IMAGE_LIMIT) return null;
    const keys = parsed.filter((key): key is string => typeof key === "string");
    const prefix = `${authUserId}/properties/`;
    const validKey = new RegExp(`^${authUserId}/properties/[a-f0-9-]+\\.(jpg|png|webp|avif)$`, "i");
    if (keys.length !== parsed.length || new Set(keys).size !== keys.length || keys.some(key => !key.startsWith(prefix) || !validKey.test(key))) return null;
    return keys;
  } catch {
    return null;
  }
}

function parseVideoKey(value: string, authUserId: string) {
  if (!value) return "";
  const validKey = new RegExp(`^${authUserId}/properties/[a-f0-9-]+\\.(mp4|webm|mov|m4v)$`, "i");
  return validKey.test(value) ? value : null;
}

function videoMimeTypeFromKey(key: string) {
  if (key.toLowerCase().endsWith(".webm")) return "video/webm";
  if (key.toLowerCase().endsWith(".mov")) return "video/quicktime";
  if (key.toLowerCase().endsWith(".m4v")) return "video/x-m4v";
  return "video/mp4";
}

async function removeUploadedMedia(keys: string[]) {
  if (!keys.length) return;
  try {
    const { error } = await createAdminClient().storage.from(STORAGE_BUCKETS.properties).remove(keys);
    if (error) throw error;
  } catch (error) {
    console.warn("[publicar/imovel] Não foi possível limpar mídias enviadas.", { message: error instanceof Error ? error.message : String(error) });
  }
}

async function verifyUploadedImages(keys: string[], authUserId: string) {
  if (!keys.length) return true;
  const folder = `${authUserId}/properties`;
  const storage = createAdminClient().storage.from(STORAGE_BUCKETS.properties);
  const checks = await Promise.all(keys.map(async key => {
    const name = key.slice(folder.length + 1);
    const { data, error } = await storage.list(folder, { limit: 2, search: name });
    if (error) return false;
    const file = data?.find(candidate => candidate.name === name);
    const metadata = file?.metadata as { size?: number; mimetype?: string } | undefined;
    return Boolean(file && metadata?.size && metadata.size <= PROPERTY_IMAGE_MAX_BYTES && metadata.mimetype && PROPERTY_IMAGE_MIME_TYPES.includes(metadata.mimetype as (typeof PROPERTY_IMAGE_MIME_TYPES)[number]));
  }));
  return checks.every(Boolean);
}

async function verifyUploadedVideo(key: string, authUserId: string) {
  if (!key) return true;
  const folder = `${authUserId}/properties`;
  const name = key.slice(folder.length + 1);
  const { data, error } = await createAdminClient().storage.from(STORAGE_BUCKETS.properties).list(folder, { limit: 2, search: name });
  if (error) return false;
  const file = data?.find(candidate => candidate.name === name);
  const metadata = file?.metadata as { size?: number; mimetype?: string } | undefined;
  return Boolean(
    file &&
    metadata?.size && metadata.size <= PROPERTY_VIDEO_MAX_BYTES &&
    metadata.mimetype && PROPERTY_VIDEO_MIME_TYPES.includes(metadata.mimetype as (typeof PROPERTY_VIDEO_MIME_TYPES)[number])
  );
}

export async function createProperty(formData: FormData) {
  const user = await requireCurrentUser("/publicar/imovel");
  if (!user.authUserId) redirect("/entrar?next=%2Fpublicar%2Fimovel");
  const imageKeys = parseImageKeys(field(formData, "imageKeys"), user.authUserId);
  const videoKey = parseVideoKey(field(formData, "videoKey"), user.authUserId);
  if (!imageKeys || videoKey === null) redirect("/publicar/imovel?erro=fotos");
  const uploadedMediaKeys = [...imageKeys, ...(videoKey ? [videoKey] : [])];
  const title = field(formData, "title");
  const description = field(formData, "description");
  const cityId = field(formData, "cityId");
  const neighborhoodId = field(formData, "neighborhoodId");
  const purpose = field(formData, "purpose");
  const type = field(formData, "type");
  const priceCents = parseMoneyToCents(field(formData, "price"));
  const whatsapp = normalizeBrazilianPhone(field(formData, "whatsapp"));

  const validPurposes = ["RENT", "SALE"] as const;
  const validTypes = ["HOUSE", "APARTMENT", "STUDIO", "LAND", "COMMERCIAL_ROOM", "WAREHOUSE", "OTHER"] as const;
  const validPurpose = validPurposes.includes(purpose as never);
  const validType = validTypes.includes(type as never);
  if (title.length < 8 || description.length < 30 || !priceCents || !whatsapp || !validPurpose || !validType) {
    console.warn("[publicar/imovel] Validação rejeitada.", {
      titleLength: title.length,
      descriptionLength: description.length,
      hasPrice: Boolean(priceCents),
      hasWhatsapp: Boolean(whatsapp),
      validPurpose,
      validType,
      hasCity: Boolean(cityId),
      hasNeighborhood: Boolean(neighborhoodId),
    });
    await removeUploadedMedia(uploadedMediaKeys);
    redirect("/publicar/imovel?erro=dados");
  }

  const neighborhood = await prisma.neighborhood.findFirst({ where: { id: neighborhoodId, cityId, city: { isActive: true } }, include: { city: true } });
  if (!neighborhood) {
    await removeUploadedMedia(uploadedMediaKeys);
    redirect("/publicar/imovel?erro=local");
  }

  const [imagesAreValid, videoIsValid] = await Promise.all([
    verifyUploadedImages(imageKeys, user.authUserId),
    verifyUploadedVideo(videoKey, user.authUserId),
  ]);
  if (!imagesAreValid || !videoIsValid) {
    await removeUploadedMedia(uploadedMediaKeys);
    redirect("/publicar/imovel?erro=fotos");
  }

  try {
    await prisma.property.create({ data: {
      publicCode: createPublicCode(),
      slug: propertySlug(title, neighborhood.name, neighborhood.city.name),
      ownerId: user.id, cityId, neighborhoodId,
      title, description, priceCents, whatsapp,
      purpose: purpose as "RENT" | "SALE", type: type as "HOUSE" | "APARTMENT" | "STUDIO" | "LAND" | "COMMERCIAL_ROOM" | "WAREHOUSE" | "OTHER",
      bedrooms: Number(field(formData, "bedrooms")) || null,
      bathrooms: Number(field(formData, "bathrooms")) || null,
      parkingSpots: Number(field(formData, "parkingSpots")) || null,
      status: "PENDING",
      images: imageKeys.length ? { create: imageKeys.map((storageKey, position) => ({ storageKey, position, altText: `${title} — foto ${position + 1}` })) } : undefined,
      videos: videoKey ? { create: { storageKey: videoKey, mimeType: videoMimeTypeFromKey(videoKey) } } : undefined,
    }});
  } catch (error) {
    await removeUploadedMedia(uploadedMediaKeys);
    console.error("[publicar/imovel] Falha ao salvar anúncio.", {
      message: error instanceof Error ? error.message : String(error),
    });
    redirect("/publicar/imovel?erro=salvar");
  }
  redirect("/meus-anuncios?criado=imovel");
}
