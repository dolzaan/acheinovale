"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { normalizeBrazilianPhone } from "@/lib/validation/profile";
import { parseMoneyToCents, uniqueSlug } from "@/lib/validation/listing";

function field(data: FormData, name: string) { const value = data.get(name); return typeof value === "string" ? value.trim() : ""; }

export async function createProperty(formData: FormData) {
  const user = await requireCurrentUser("/publicar/imovel");
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
  if (title.length < 8 || description.length < 30 || !priceCents || !whatsapp || !validPurposes.includes(purpose as never) || !validTypes.includes(type as never)) redirect("/publicar/imovel?erro=dados");

  const neighborhood = await prisma.neighborhood.findFirst({ where: { id: neighborhoodId, cityId, city: { isActive: true } } });
  if (!neighborhood) redirect("/publicar/imovel?erro=local");

  await prisma.property.create({ data: {
    slug: uniqueSlug(title), ownerId: user.id, cityId, neighborhoodId,
    title, description, priceCents, whatsapp,
    purpose: purpose as "RENT" | "SALE", type: type as "HOUSE" | "APARTMENT" | "STUDIO" | "LAND" | "COMMERCIAL_ROOM" | "WAREHOUSE" | "OTHER",
    bedrooms: Number(field(formData, "bedrooms")) || null,
    bathrooms: Number(field(formData, "bathrooms")) || null,
    parkingSpots: Number(field(formData, "parkingSpots")) || null,
    status: "PENDING",
  }});
  redirect("/meus-anuncios?criado=imovel");
}
