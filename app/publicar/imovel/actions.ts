"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { normalizeBrazilianPhone } from "@/lib/validation/profile";
import { createPublicCode, parseMoneyToCents, propertySlug } from "@/lib/validation/listing";

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
    redirect("/publicar/imovel?erro=dados");
  }

  const neighborhood = await prisma.neighborhood.findFirst({ where: { id: neighborhoodId, cityId, city: { isActive: true } }, include: { city: true } });
  if (!neighborhood) redirect("/publicar/imovel?erro=local");

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
    }});
  } catch (error) {
    console.error("[publicar/imovel] Falha ao salvar anúncio.", {
      message: error instanceof Error ? error.message : String(error),
    });
    redirect("/publicar/imovel?erro=salvar");
  }
  redirect("/meus-anuncios?criado=imovel");
}
