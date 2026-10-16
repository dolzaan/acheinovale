import "server-only";

import type { Prisma, PropertyPurpose, PropertyType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getAddressByCep, normalizeCep } from "@/lib/location/cep";
import { normalizeNeighborhoodName } from "@/lib/location/neighborhood";
import { normalizeBrazilianPhone } from "@/lib/validation/profile";
import { parseMoneyToCents, slugify } from "@/lib/validation/listing";

const PURPOSES: readonly PropertyPurpose[] = ["RENT", "SALE"];
const TYPES: readonly PropertyType[] = ["HOUSE", "APARTMENT", "STUDIO", "LAND", "COMMERCIAL_ROOM", "WAREHOUSE", "OTHER"];

export type PropertyDetailsError = "dados" | "cep" | "local";

export type PropertyDetails = {
  title: string;
  description: string;
  purpose: PropertyPurpose;
  type: PropertyType;
  priceCents: number;
  whatsapp: string;
  bedrooms: number | null;
  bathrooms: number | null;
  parkingSpots: number | null;
  neighborhood: { id: string; name: string; cityId: string; city: { name: string } };
  privateAddressData: Prisma.InputJsonValue | null;
};

function field(data: FormData, name: string) {
  const value = data.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function optionalInteger(data: FormData, name: string, min: number, max: number) {
  const raw = field(data, name);
  if (!raw) return { valid: true, value: null };
  const value = Number(raw);
  return Number.isInteger(value) && value >= min && value <= max
    ? { valid: true, value }
    : { valid: false, value: null };
}

export async function resolveCepLocation(cep: string) {
  const address = await getAddressByCep(cep);
  if (!address || address.stateCode !== "SC") return null;

  const city = await prisma.city.findFirst({
    where: { ibgeCode: address.ibgeCode, stateCode: address.stateCode, isActive: true },
    select: { id: true, name: true, stateCode: true },
  });
  if (!city) return { address, city: null, neighborhood: null };

  const neighborhoodSlug = slugify(address.neighborhood);
  const neighborhood = neighborhoodSlug
    ? await prisma.neighborhood.upsert({
      where: { cityId_slug: { cityId: city.id, slug: neighborhoodSlug } },
      update: { name: address.neighborhood },
      create: { cityId: city.id, name: address.neighborhood, slug: neighborhoodSlug },
      select: { id: true, name: true },
    })
    : null;

  return { address, city, neighborhood };
}

/**
 * Valida os dados textuais de um imóvel (publicação ou edição) e resolve o bairro
 * no servidor. O bairro retornado é sempre o registro do banco: nunca use o
 * neighborhoodId enviado pelo formulário diretamente.
 */
export async function parsePropertyDetails(formData: FormData): Promise<
  { ok: true; details: PropertyDetails } | { ok: false; error: PropertyDetailsError }
> {
  const title = field(formData, "title");
  const description = field(formData, "description");
  const cityId = field(formData, "cityId");
  let neighborhoodId = field(formData, "neighborhoodId");
  let neighborhoodName = normalizeNeighborhoodName(field(formData, "neighborhoodName"));
  const rawCep = field(formData, "cep");
  const cep = normalizeCep(rawCep);
  const purpose = field(formData, "purpose") as PropertyPurpose;
  const type = field(formData, "type") as PropertyType;
  const priceCents = parseMoneyToCents(field(formData, "price"));
  const whatsapp = normalizeBrazilianPhone(field(formData, "whatsapp"));
  const bedrooms = optionalInteger(formData, "bedrooms", 0, 30);
  const bathrooms = optionalInteger(formData, "bathrooms", 0, 30);
  const parkingSpots = optionalInteger(formData, "parkingSpots", 0, 30);
  const street = field(formData, "street");
  const addressNumber = field(formData, "addressNumber");
  const addressComplement = field(formData, "addressComplement");

  if (
    title.length < 8 || title.length > 120 ||
    description.length < 30 || description.length > 3000 ||
    neighborhoodName.length > 80 || street.length > 160 || addressNumber.length > 20 || addressComplement.length > 120 ||
    !bedrooms.valid || !bathrooms.valid || !parkingSpots.valid ||
    !priceCents || !whatsapp || !PURPOSES.includes(purpose) || !TYPES.includes(type)
  ) {
    return { ok: false, error: "dados" };
  }

  let verifiedAddress: Awaited<ReturnType<typeof resolveCepLocation>> = null;
  if (rawCep) {
    if (!cep) return { ok: false, error: "cep" };
    try {
      verifiedAddress = await resolveCepLocation(cep);
    } catch (error) {
      console.warn("[imovel] Não foi possível validar o CEP.", {
        message: error instanceof Error ? error.message : String(error),
      });
      return { ok: false, error: "cep" };
    }
    if (!verifiedAddress?.city || verifiedAddress.city.id !== cityId) return { ok: false, error: "cep" };
    if (verifiedAddress.neighborhood && !neighborhoodName) {
      neighborhoodId = verifiedAddress.neighborhood.id;
      neighborhoodName = verifiedAddress.neighborhood.name;
    }
  }

  let neighborhood = neighborhoodId
    ? await prisma.neighborhood.findFirst({ where: { id: neighborhoodId, cityId, city: { isActive: true } }, include: { city: true } })
    : null;

  if (!neighborhood && neighborhoodName.length >= 2 && neighborhoodName.length <= 80) {
    const neighborhoodSlug = slugify(neighborhoodName);
    const cityIsAvailable = await prisma.city.findFirst({ where: { id: cityId, isActive: true }, select: { id: true } });
    if (neighborhoodSlug && cityIsAvailable) {
      neighborhood = await prisma.neighborhood.upsert({
        where: { cityId_slug: { cityId, slug: neighborhoodSlug } },
        update: {},
        create: { cityId, name: neighborhoodName, slug: neighborhoodSlug, needsReview: true },
        include: { city: true },
      });
    }
  }

  if (!neighborhood) return { ok: false, error: "local" };

  return {
    ok: true,
    details: {
      title,
      description,
      purpose,
      type,
      priceCents,
      whatsapp,
      bedrooms: bedrooms.value,
      bathrooms: bathrooms.value,
      parkingSpots: parkingSpots.value,
      neighborhood,
      privateAddressData: cep ? {
        cep,
        logradouro: verifiedAddress?.address.street || street || null,
        numero: addressNumber || null,
        complemento: addressComplement || verifiedAddress?.address.complement || null,
      } : null,
    },
  };
}
