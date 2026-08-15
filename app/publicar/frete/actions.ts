"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { normalizeBrazilianPhone } from "@/lib/validation/profile";
import { createPublicCode, freighterSlug, slugify } from "@/lib/validation/listing";

function field(data: FormData, name: string) { const value = data.get(name); return typeof value === "string" ? value.trim() : ""; }

export async function saveFreighterProfile(formData: FormData) {
  const user = await requireCurrentUser("/publicar/frete");
  const displayName = field(formData, "displayName"); const description = field(formData, "description"); const cityId = field(formData, "cityId"); const whatsapp = normalizeBrazilianPhone(field(formData, "whatsapp"));
  const services = field(formData, "services").split(",").map(s => s.trim()).filter(Boolean).slice(0, 8);
  const city = await prisma.city.findFirst({ where: { id: cityId, isActive: true } });
  if (!city || !whatsapp || displayName.length < 3 || description.length < 30 || !services.length) redirect("/publicar/frete?erro=dados");
  const existing = await prisma.freighterProfile.findUnique({ where: { userId: user.id } });
  await prisma.$transaction(async tx => {
    const slug = freighterSlug(displayName, city.name);
    const profile = existing ? await tx.freighterProfile.update({ where: { id: existing.id }, data: { slug, displayName, description, cityId, whatsapp, serviceRadiusKm: Number(field(formData, "serviceRadiusKm")) || null, priceNote: field(formData, "priceNote") || null, availableToday: field(formData, "availableToday") === "on", status: "PENDING" } }) : await tx.freighterProfile.create({ data: { publicCode: createPublicCode(), userId: user.id, slug, displayName, description, cityId, whatsapp, serviceRadiusKm: Number(field(formData, "serviceRadiusKm")) || null, priceNote: field(formData, "priceNote") || null, availableToday: field(formData, "availableToday") === "on", status: "PENDING" } });
    await tx.freighterService.deleteMany({ where: { profileId: profile.id } });
    await tx.freighterService.createMany({ data: services.map(name => ({ profileId: profile.id, name, slug: slugify(name) })) });
  });
  redirect("/meus-anuncios?criado=frete");
}
