"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requirePropertyOwner } from "@/lib/listings/authorization";
import {
  isPropertyImageKey,
  isPropertyVideoKey,
  removePropertyMedia,
  verifyPropertyImages,
  verifyPropertyVideo,
  videoMimeTypeFromKey,
} from "@/lib/listings/property-media";
import { propertyUrl } from "@/lib/listings/urls";
import { PROPERTY_IMAGE_LIMIT, PROPERTY_VIDEO_LIMIT } from "@/lib/supabase/storage";

type MediaItem = { kind: "image" | "video"; id?: string; storageKey?: string };

function parseMedia(value: FormDataEntryValue | null): MediaItem[] | null {
  try {
    const parsed: unknown = JSON.parse(typeof value === "string" ? value : "[]");
    if (!Array.isArray(parsed) || parsed.length > PROPERTY_IMAGE_LIMIT + PROPERTY_VIDEO_LIMIT) return null;
    const items: MediaItem[] = [];
    for (const candidate of parsed) {
      if (!candidate || typeof candidate !== "object") return null;
      const kind = "kind" in candidate ? candidate.kind : null;
      const id = "id" in candidate ? candidate.id : null;
      const storageKey = "storageKey" in candidate ? candidate.storageKey : null;
      if (kind !== "image" && kind !== "video") return null;
      if (typeof id === "string" && id) items.push({ kind, id });
      else if (typeof storageKey === "string" && storageKey) items.push({ kind, storageKey });
      else return null;
    }
    return items;
  } catch {
    return null;
  }
}

async function cleanup(keys: string[]) {
  try { await removePropertyMedia(keys); }
  catch (error) { console.warn("[meus-anuncios/midias] Falha ao limpar Storage.", error); }
}

export async function updatePropertyMedia(propertyId: string, formData: FormData) {
  const { user, property } = await requirePropertyOwner(propertyId);
  if (!user.authUserId || property.status === "ARCHIVED") redirect(`/meus-anuncios/${propertyId}/midias?erro=permissao`);

  const items = parseMedia(formData.get("mediaOrder"));
  const newKeys = items?.flatMap(item => item.storageKey ? [item.storageKey] : []) ?? [];
  if (!items) {
    await cleanup(newKeys);
    redirect(`/meus-anuncios/${propertyId}/midias?erro=dados`);
  }

  const imageItems = items.filter(item => item.kind === "image");
  const videoItems = items.filter(item => item.kind === "video");
  if (imageItems.length > PROPERTY_IMAGE_LIMIT || videoItems.length > PROPERTY_VIDEO_LIMIT || (imageItems.length && items[0]?.kind !== "image")) {
    await cleanup(newKeys);
    redirect(`/meus-anuncios/${propertyId}/midias?erro=limite`);
  }

  const [storedImages, storedVideos] = await Promise.all([
    prisma.propertyImage.findMany({ where: { propertyId } }),
    prisma.propertyVideo.findMany({ where: { propertyId } }),
  ]);
  const imageById = new Map(storedImages.map(image => [image.id, image]));
  const videoById = new Map(storedVideos.map(video => [video.id, video]));
  const existingIds = items.flatMap(item => item.id ? [item.id] : []);
  const validExisting = existingIds.length === new Set(existingIds).size && items.every(item => {
    if (!item.id) return true;
    return item.kind === "image" ? imageById.has(item.id) : videoById.has(item.id);
  });
  const newImageKeys = items.flatMap(item => item.storageKey && item.kind === "image" ? [item.storageKey] : []);
  const newVideoKeys = items.flatMap(item => item.storageKey && item.kind === "video" ? [item.storageKey] : []);
  const keysAreValid = new Set(newKeys).size === newKeys.length
    && newImageKeys.every(key => isPropertyImageKey(key, user.authUserId!))
    && newVideoKeys.every(key => isPropertyVideoKey(key, user.authUserId!));
  const [imagesAreStored, videosAreStored] = await Promise.all([
    keysAreValid ? verifyPropertyImages(newImageKeys, user.authUserId) : false,
    keysAreValid ? verifyPropertyVideo(newVideoKeys[0] || "", user.authUserId) : false,
  ]);
  if (!validExisting || !keysAreValid || !imagesAreStored || !videosAreStored) {
    await cleanup(newKeys);
    redirect(`/meus-anuncios/${propertyId}/midias?erro=dados`);
  }

  const keptImageIds = new Set(items.flatMap(item => item.id && item.kind === "image" ? [item.id] : []));
  const keptVideoIds = new Set(items.flatMap(item => item.id && item.kind === "video" ? [item.id] : []));
  const removedImages = storedImages.filter(image => !keptImageIds.has(image.id));
  const removedVideos = storedVideos.filter(video => !keptVideoIds.has(video.id));
  const contentChanged = Boolean(newKeys.length || removedImages.length || removedVideos.length);

  try {
    await prisma.$transaction(async tx => {
      if (removedImages.length) await tx.propertyImage.deleteMany({ where: { id: { in: removedImages.map(item => item.id) }, propertyId } });
      if (removedVideos.length) await tx.propertyVideo.deleteMany({ where: { id: { in: removedVideos.map(item => item.id) }, propertyId } });
      for (const [position, item] of items.entries()) {
        if (item.id) {
          if (item.kind === "image") await tx.propertyImage.update({ where: { id: item.id }, data: { position } });
          else await tx.propertyVideo.update({ where: { id: item.id }, data: { position } });
        } else if (item.storageKey) {
          if (item.kind === "image") await tx.propertyImage.create({ data: { propertyId, storageKey: item.storageKey, position, altText: `${property.title} — foto` } });
          else await tx.propertyVideo.create({ data: { propertyId, storageKey: item.storageKey, position, mimeType: videoMimeTypeFromKey(item.storageKey) } });
        }
      }
      await tx.property.update({
        where: { id: propertyId },
        data: contentChanged ? { status: "PENDING", moderationNote: null, moderatedAt: null, moderatedById: null, publishedAt: null } : { updatedAt: new Date() },
      });
    });
  } catch (error) {
    await cleanup(newKeys);
    console.error("[meus-anuncios/midias] Falha ao salvar.", error);
    redirect(`/meus-anuncios/${propertyId}/midias?erro=salvar`);
  }

  await cleanup([...removedImages.map(item => item.storageKey), ...removedVideos.map(item => item.storageKey)]);
  revalidatePath("/meus-anuncios");
  revalidatePath("/imoveis");
  revalidatePath(propertyUrl(property));
  redirect(`/meus-anuncios/${propertyId}/midias?salvo=1${contentChanged ? "&revisao=1" : ""}`);
}
