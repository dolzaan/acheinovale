"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { normalizeBrazilianPhone } from "@/lib/validation/profile";
import { createPublicCode, freighterSlug, slugify } from "@/lib/validation/listing";

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

  const city = await prisma.city.findFirst({ where: { id: cityId, isActive: true } });
  if (
    !city || !whatsapp || !radius.valid || !servicesAreValid ||
    displayName.length < 3 || displayName.length > 100 ||
    description.length < 30 || description.length > 2000 ||
    priceNote.length > 120
  ) {
    redirect("/publicar/frete?erro=dados");
  }

  const existing = await prisma.freighterProfile.findUnique({ where: { userId: user.id } });
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

    await tx.freighterService.deleteMany({ where: { profileId: profile.id } });
    await tx.freighterService.createMany({
      data: services.map((name, index) => ({ profileId: profile.id, name, slug: serviceSlugs[index] })),
    });
  });

  redirect("/meus-anuncios?criado=frete");
}
