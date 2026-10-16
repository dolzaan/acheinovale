"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { notifyAdminsPending, sendLater } from "@/lib/email/notifications";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { normalizeCep } from "@/lib/location/cep";
import { parsePropertyDetails, resolveCepLocation } from "@/lib/listings/property-details";
import {
  parseImageKeys,
  parseStoredMediaOrder,
  parseVideoKey,
  removePropertyMedia,
  releasePropertyMediaUploadGrants,
  verifyPropertyImages,
  verifyPropertyVideo,
  videoMimeTypeFromKey,
} from "@/lib/listings/property-media";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { createPublicCode, propertySlug } from "@/lib/validation/listing";

function field(data: FormData, name: string) { const value = data.get(name); return typeof value === "string" ? value.trim() : ""; }

async function removeUploadedMedia(keys: string[]) {
  if (!keys.length) return;
  try {
    await removePropertyMedia(keys);
  } catch (error) {
    console.warn("[publicar/imovel] Não foi possível limpar mídias enviadas.", { message: error instanceof Error ? error.message : String(error) });
  }
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

  const parsed = await parsePropertyDetails(formData);
  if (!parsed.ok) {
    await removeUploadedMedia(uploadedMediaKeys);
    redirect(`/publicar/imovel?erro=${parsed.error}`);
  }
  const { neighborhood, privateAddressData, ...details } = parsed.details;

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
      ...details,
      publicCode: createPublicCode(),
      slug: propertySlug(details.title, neighborhood.name, neighborhood.city.name),
      ownerId: user.id,
      cityId: neighborhood.cityId,
      neighborhoodId: neighborhood.id,
      privateAddressData: privateAddressData ?? undefined,
      status: "PENDING",
      images: imageKeys.length ? { create: imageKeys.map((storageKey, imageIndex) => ({ storageKey, position: mediaOrder.findIndex(item => item.storageKey === storageKey), altText: `${details.title} — foto ${imageIndex + 1}` })) } : undefined,
      videos: videoKey ? { create: { storageKey: videoKey, mimeType: videoMimeTypeFromKey(videoKey), position: mediaOrder.findIndex(item => item.storageKey === videoKey) } } : undefined,
    }});
  } catch (error) {
    await removeUploadedMedia(uploadedMediaKeys);
    console.error("[publicar/imovel] Falha ao salvar anúncio.", {
      message: error instanceof Error ? error.message : String(error),
    });
    redirect("/publicar/imovel?erro=salvar");
  }
  await releasePropertyMediaUploadGrants(uploadedMediaKeys);
  sendLater(() => notifyAdminsPending({ what: "Novo imóvel enviado para análise", title: details.title, path: "/admin/anuncios?tipo=imoveis&status=PENDING" }));
  redirect("/meus-anuncios?criado=imovel");
}
