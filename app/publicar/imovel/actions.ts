"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { getAddressByCep, normalizeCep } from "@/lib/location/cep";
import {
  parseImageKeys,
  parseStoredMediaOrder,
  parseVideoKey,
  removePropertyMedia,
  verifyPropertyImages,
  verifyPropertyVideo,
  videoMimeTypeFromKey,
} from "@/lib/listings/property-media";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { normalizeBrazilianPhone } from "@/lib/validation/profile";
import { createPublicCode, parseMoneyToCents, propertySlug, slugify } from "@/lib/validation/listing";

function field(data: FormData, name: string) { const value = data.get(name); return typeof value === "string" ? value.trim() : ""; }

function optionalInteger(data: FormData, name: string, min: number, max: number) {
  const raw = field(data, name);
  if (!raw) return { valid: true, value: null };
  const value = Number(raw);
  return Number.isInteger(value) && value >= min && value <= max
    ? { valid: true, value }
    : { valid: false, value: null };
}

async function removeUploadedMedia(keys: string[]) {
  if (!keys.length) return;
  try {
    await removePropertyMedia(keys);
  } catch (error) {
    console.warn("[publicar/imovel] Não foi possível limpar mídias enviadas.", { message: error instanceof Error ? error.message : String(error) });
  }
}

async function resolveCepLocation(cep: string) {
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

export async function lookupPropertyCep(rawCep: string) {
  const user = await requireCurrentUser("/publicar/imovel");
  if (!user.authUserId) return { ok: false as const, message: "Entre novamente para consultar o CEP." };

  const rateLimit = await checkRateLimit({ scope: "cep", identifier: user.id, limit: 30, windowSeconds: 10 * 60 });
  if (!rateLimit.allowed) return { ok: false as const, message: "Muitas consultas de CEP. Aguarde alguns minutos e tente novamente." };

  const cep = normalizeCep(rawCep);
  if (!cep) return { ok: false as const, message: "Digite um CEP com 8 números." };

  try {
    const location = await resolveCepLocation(cep);
    if (!location) return { ok: false as const, message: "CEP não encontrado ou fora de Santa Catarina." };
    if (!location.city) return { ok: false as const, message: `${location.address.city} ainda não está disponível no AcheiNoVale.` };

    return {
      ok: true as const,
      cep: location.address.cep,
      street: location.address.street,
      complement: location.address.complement,
      city: location.city,
      neighborhood: location.neighborhood,
      message: location.neighborhood
        ? "Cidade, bairro e endereço preenchidos pelo CEP."
        : "Cidade encontrada. Escolha um bairro da lista ou digite o nome para continuar.",
    };
  } catch (error) {
    console.warn("[publicar/imovel] Falha ao consultar CEP.", {
      message: error instanceof Error ? error.message : String(error),
    });
    return { ok: false as const, message: "Não foi possível consultar o CEP agora. Tente novamente." };
  }
}

export async function createProperty(formData: FormData) {
  const user = await requireCurrentUser("/publicar/imovel");
  if (!user.authUserId) redirect("/entrar?next=%2Fpublicar%2Fimovel");
  const rateLimit = await checkRateLimit({ scope: "publicar-imovel", identifier: user.id, limit: 10, windowSeconds: 60 * 60 });
  if (!rateLimit.allowed) redirect("/publicar/imovel?erro=limite");
  const imageKeys = parseImageKeys(field(formData, "imageKeys"), user.authUserId);
  const videoKey = parseVideoKey(field(formData, "videoKey"), user.authUserId);
  const mediaOrder = imageKeys && videoKey !== null ? parseStoredMediaOrder(field(formData, "mediaOrder"), imageKeys, videoKey, user.authUserId) : null;
  if (!imageKeys || videoKey === null || !mediaOrder) redirect("/publicar/imovel?erro=fotos");
  const uploadedMediaKeys = [...imageKeys, ...(videoKey ? [videoKey] : [])];
  const title = field(formData, "title");
  const description = field(formData, "description");
  const cityId = field(formData, "cityId");
  let neighborhoodId = field(formData, "neighborhoodId");
  let neighborhoodName = field(formData, "neighborhoodName").replace(/\s+/g, " ");
  const cep = normalizeCep(field(formData, "cep"));
  const purpose = field(formData, "purpose");
  const type = field(formData, "type");
  const priceCents = parseMoneyToCents(field(formData, "price"));
  const whatsapp = normalizeBrazilianPhone(field(formData, "whatsapp"));
  const bedrooms = optionalInteger(formData, "bedrooms", 0, 30);
  const bathrooms = optionalInteger(formData, "bathrooms", 0, 30);
  const parkingSpots = optionalInteger(formData, "parkingSpots", 0, 30);
  const street = field(formData, "street");
  const addressNumber = field(formData, "addressNumber");
  const addressComplement = field(formData, "addressComplement");

  const validPurposes = ["RENT", "SALE"] as const;
  const validTypes = ["HOUSE", "APARTMENT", "STUDIO", "LAND", "COMMERCIAL_ROOM", "WAREHOUSE", "OTHER"] as const;
  const validPurpose = validPurposes.includes(purpose as never);
  const validType = validTypes.includes(type as never);
  if (
    title.length < 8 || title.length > 120 ||
    description.length < 30 || description.length > 3000 ||
    neighborhoodName.length > 80 || street.length > 160 || addressNumber.length > 20 || addressComplement.length > 120 ||
    !bedrooms.valid || !bathrooms.valid || !parkingSpots.valid ||
    !priceCents || !whatsapp || !validPurpose || !validType
  ) {
    console.warn("[publicar/imovel] Validação rejeitada.", {
      titleLength: title.length,
      descriptionLength: description.length,
      hasPrice: Boolean(priceCents),
      hasWhatsapp: Boolean(whatsapp),
      validPurpose,
      validType,
      hasCity: Boolean(cityId),
      hasNeighborhood: Boolean(neighborhoodId || neighborhoodName),
    });
    await removeUploadedMedia(uploadedMediaKeys);
    redirect("/publicar/imovel?erro=dados");
  }

  let verifiedAddress: Awaited<ReturnType<typeof resolveCepLocation>> = null;
  if (field(formData, "cep")) {
    if (!cep) {
      await removeUploadedMedia(uploadedMediaKeys);
      redirect("/publicar/imovel?erro=cep");
    }
    try {
      verifiedAddress = await resolveCepLocation(cep);
    } catch (error) {
      console.warn("[publicar/imovel] Não foi possível validar o CEP ao publicar.", {
        message: error instanceof Error ? error.message : String(error),
      });
      await removeUploadedMedia(uploadedMediaKeys);
      redirect("/publicar/imovel?erro=cep");
    }
    if (!verifiedAddress?.city || verifiedAddress.city.id !== cityId) {
      await removeUploadedMedia(uploadedMediaKeys);
      redirect("/publicar/imovel?erro=cep");
    }
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
        update: { name: neighborhoodName, needsReview: true },
        create: { cityId, name: neighborhoodName, slug: neighborhoodSlug, needsReview: true },
        include: { city: true },
      });
    }
  }

  if (!neighborhood) {
    await removeUploadedMedia(uploadedMediaKeys);
    redirect("/publicar/imovel?erro=local");
  }

  const [imagesAreValid, videoIsValid] = await Promise.all([
    verifyPropertyImages(imageKeys, user.authUserId),
    verifyPropertyVideo(videoKey, user.authUserId),
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
      bedrooms: bedrooms.value,
      bathrooms: bathrooms.value,
      parkingSpots: parkingSpots.value,
      privateAddressData: cep ? {
        cep,
        logradouro: verifiedAddress?.address.street || street || null,
        numero: addressNumber || null,
        complemento: addressComplement || verifiedAddress?.address.complement || null,
      } : undefined,
      status: "PENDING",
      images: imageKeys.length ? { create: imageKeys.map((storageKey, imageIndex) => ({ storageKey, position: mediaOrder.findIndex(item => item.storageKey === storageKey), altText: `${title} — foto ${imageIndex + 1}` })) } : undefined,
      videos: videoKey ? { create: { storageKey: videoKey, mimeType: videoMimeTypeFromKey(videoKey), position: mediaOrder.findIndex(item => item.storageKey === videoKey) } } : undefined,
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
