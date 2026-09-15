"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireFreighterOwner } from "@/lib/listings/authorization";
import { isFreighterImageKey, removeFreighterImages, verifyFreighterImages } from "@/lib/listings/freighter-media";
import { freighterUrl } from "@/lib/listings/urls";
import { revalidatePublicListings } from "@/lib/listings/public-cache";
import { FREIGHTER_IMAGE_LIMIT } from "@/lib/supabase/storage";

type ImageItem = { id?: string; storageKey?: string };

function parseImages(value: FormDataEntryValue | null): ImageItem[] | null {
  try {
    const parsed: unknown = JSON.parse(typeof value === "string" ? value : "[]");
    if (!Array.isArray(parsed) || parsed.length > FREIGHTER_IMAGE_LIMIT) return null;
    const items: ImageItem[] = [];
    for (const candidate of parsed) {
      if (!candidate || typeof candidate !== "object") return null;
      const id = "id" in candidate ? candidate.id : null;
      const storageKey = "storageKey" in candidate ? candidate.storageKey : null;
      if (typeof id === "string" && id && !storageKey) items.push({ id });
      else if (typeof storageKey === "string" && storageKey && !id) items.push({ storageKey });
      else return null;
    }
    return items;
  } catch {
    return null;
  }
}

async function cleanup(keys: string[]) {
  try { await removeFreighterImages(keys); }
  catch (error) { console.warn("[freteiro/midias] Falha ao limpar o armazenamento.", error); }
}

export async function updateFreighterImages(profileId: string, formData: FormData) {
  const { user, profile } = await requireFreighterOwner(profileId);
  if (!user.authUserId || profile.status === "ARCHIVED") redirect(`/meus-anuncios/${profileId}/freteiro-midias?erro=permissao`);

  const items = parseImages(formData.get("imageOrder"));
  const newKeys = items?.flatMap(item => item.storageKey ? [item.storageKey] : []) ?? [];
  if (!items) {
    await cleanup(newKeys);
    redirect(`/meus-anuncios/${profileId}/freteiro-midias?erro=dados`);
  }

  const storedImages = await prisma.freighterImage.findMany({ where: { profileId } });
  const storedById = new Map(storedImages.map(image => [image.id, image]));
  const existingIds = items.flatMap(item => item.id ? [item.id] : []);
  const validExisting = existingIds.length === new Set(existingIds).size && existingIds.every(id => storedById.has(id));
  const validKeys = newKeys.length === new Set(newKeys).size && newKeys.every(key => isFreighterImageKey(key, user.authUserId!));
  const imagesAreStored = validKeys && await verifyFreighterImages(newKeys, user.authUserId);
  if (!validExisting || !validKeys || !imagesAreStored) {
    await cleanup(newKeys);
    redirect(`/meus-anuncios/${profileId}/freteiro-midias?erro=dados`);
  }

  const keptIds = new Set(existingIds);
  const removedImages = storedImages.filter(image => !keptIds.has(image.id));
  const contentChanged = Boolean(newKeys.length || removedImages.length);
  try {
    await prisma.$transaction(async tx => {
      if (removedImages.length) await tx.freighterImage.deleteMany({ where: { profileId, id: { in: removedImages.map(image => image.id) } } });
      for (const [position, item] of items.entries()) {
        if (item.id) await tx.freighterImage.update({ where: { id: item.id }, data: { position } });
        else if (item.storageKey) await tx.freighterImage.create({ data: { profileId, storageKey: item.storageKey, position, altText: `${profile.displayName} — foto ${position + 1}` } });
      }
      await tx.freighterProfile.update({
        where: { id: profileId },
        data: contentChanged
          ? { status: "PENDING", moderationNote: null, moderatedAt: null, moderatedById: null, publishedAt: null }
          : { updatedAt: new Date() },
      });
    });
  } catch (error) {
    await cleanup(newKeys);
    console.error("[freteiro/midias] Falha ao salvar.", error);
    redirect(`/meus-anuncios/${profileId}/freteiro-midias?erro=salvar`);
  }

  await cleanup(removedImages.map(image => image.storageKey));
  revalidatePublicListings();
  revalidatePath("/");
  revalidatePath("/freteiros");
  revalidatePath("/meus-anuncios");
  revalidatePath(freighterUrl(profile));
  redirect(`/meus-anuncios/${profileId}/freteiro-midias?salvo=1${contentChanged ? "&revisao=1" : ""}`);
}
