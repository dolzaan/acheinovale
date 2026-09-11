"use server";

import { prisma } from "@/lib/db";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { isPropertyImageKey, isPropertyVideoKey } from "@/lib/listings/property-media";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  PROPERTY_IMAGE_MAX_BYTES,
  PROPERTY_IMAGE_LIMIT,
  PROPERTY_IMAGE_MIME_TYPES,
  PROPERTY_VIDEO_MAX_BYTES,
  PROPERTY_VIDEO_LIMIT,
  PROPERTY_VIDEO_MIME_TYPES,
  STORAGE_BUCKETS,
} from "@/lib/supabase/storage";

export type PropertyMediaUploadRequest = {
  storageKey: string;
  mimeType: string;
  size: number;
};

const MAX_STORED_OBJECTS_PER_USER = 250;
const MAX_STORED_BYTES_PER_USER = 500 * 1024 * 1024;
const MAX_ACTIVE_GRANTS_PER_USER = 22;
const GRANT_TTL_MS = 15 * 60 * 1000;
const ORPHAN_GRACE_MS = 60 * 60 * 1000;
const ORPHAN_CLEANUP_LIMIT = 50;

function validRequest(request: PropertyMediaUploadRequest, authUserId: string) {
  if (!Number.isSafeInteger(request.size) || request.size <= 0) return false;

  const imageMime = PROPERTY_IMAGE_MIME_TYPES.includes(
    request.mimeType as (typeof PROPERTY_IMAGE_MIME_TYPES)[number],
  );
  if (imageMime) {
    return request.size <= PROPERTY_IMAGE_MAX_BYTES &&
      isPropertyImageKey(request.storageKey, authUserId);
  }

  const videoMime = PROPERTY_VIDEO_MIME_TYPES.includes(
    request.mimeType as (typeof PROPERTY_VIDEO_MIME_TYPES)[number],
  );
  return videoMime &&
    request.size <= PROPERTY_VIDEO_MAX_BYTES &&
    isPropertyVideoKey(request.storageKey, authUserId);
}

export async function authorizePropertyMediaUploads(requests: PropertyMediaUploadRequest[]) {
  const user = await requireCurrentUser("/publicar/imovel");
  if (!user.authUserId) return { ok: false as const, message: "Sua sessão expirou. Entre novamente." };
  const authUserId = user.authUserId;

  if (
    !Array.isArray(requests) ||
    requests.length < 1 ||
    requests.length > PROPERTY_IMAGE_LIMIT + PROPERTY_VIDEO_LIMIT ||
    new Set(requests.map(request => request.storageKey)).size !== requests.length ||
    requests.some(request => !validRequest(request, authUserId))
  ) {
    return { ok: false as const, message: "Os arquivos selecionados não são válidos." };
  }

  const rateLimit = await checkRateLimit({
    scope: "autorizar-upload",
    identifier: user.id,
    limit: 12,
    windowSeconds: 15 * 60,
  });
  if (!rateLimit.allowed) {
    return { ok: false as const, message: "Muitos envios em pouco tempo. Aguarde alguns minutos." };
  }

  const folder = `${authUserId}/properties`;
  const storage = createAdminClient().storage.from(STORAGE_BUCKETS.properties);
  const { data: storedObjects, error: storageError } = await storage.list(folder, {
    limit: 1000,
    sortBy: { column: "created_at", order: "desc" },
  });
  if (storageError) {
    return { ok: false as const, message: "Não foi possível verificar seu espaço de mídia." };
  }

  let countedObjects = storedObjects ?? [];
  try {
    const storageKeys = countedObjects.map(object => `${folder}/${object.name}`);
    if (storageKeys.length) {
      const [storedImages, storedVideos] = await Promise.all([
        prisma.propertyImage.findMany({ where: { storageKey: { in: storageKeys } }, select: { storageKey: true } }),
        prisma.propertyVideo.findMany({ where: { storageKey: { in: storageKeys } }, select: { storageKey: true } }),
      ]);
      const referencedKeys = new Set([
        ...storedImages.map(image => image.storageKey),
        ...storedVideos.map(video => video.storageKey),
      ]);
      const orphanCutoff = Date.now() - ORPHAN_GRACE_MS;
      const orphanKeys = countedObjects.flatMap(object => {
        const storageKey = `${folder}/${object.name}`;
        const createdAt = object.created_at ? Date.parse(object.created_at) : Number.NaN;
        return !referencedKeys.has(storageKey) && Number.isFinite(createdAt) && createdAt < orphanCutoff
          ? [storageKey]
          : [];
      }).slice(0, ORPHAN_CLEANUP_LIMIT);

      if (orphanKeys.length) {
        const { error: cleanupError } = await storage.remove(orphanKeys);
        if (!cleanupError) {
          const removed = new Set(orphanKeys);
          countedObjects = countedObjects.filter(object => !removed.has(`${folder}/${object.name}`));
          await prisma.mediaUploadGrant.deleteMany({ where: { storageKey: { in: orphanKeys } } });
        } else {
          console.warn("[media/upload] Não foi possível limpar mídias abandonadas.", cleanupError.message);
        }
      }
    }
  } catch (error) {
    console.warn("[media/upload] Limpeza de mídias abandonadas adiada.", error instanceof Error ? error.message : String(error));
  }

  const storedBytes = countedObjects.reduce((total, object) => {
    const metadata = object.metadata as { size?: number } | undefined;
    return total + (typeof metadata?.size === "number" ? metadata.size : 0);
  }, 0);
  const requestedBytes = requests.reduce((total, request) => total + request.size, 0);
  if (
    countedObjects.length + requests.length > MAX_STORED_OBJECTS_PER_USER ||
    storedBytes + requestedBytes > MAX_STORED_BYTES_PER_USER
  ) {
    return { ok: false as const, message: "Seu limite de armazenamento de mídias foi atingido." };
  }

  try {
    const expiresAt = new Date(Date.now() + GRANT_TTL_MS);
    await prisma.$transaction(async tx => {
      await tx.mediaUploadGrant.deleteMany({
        where: { expiresAt: { lte: new Date() } },
      });
      const activeGrants = await tx.mediaUploadGrant.count({
        where: { authUserId: authUserId, expiresAt: { gt: new Date() } },
      });
      if (activeGrants + requests.length > MAX_ACTIVE_GRANTS_PER_USER) {
        throw new Error("ACTIVE_GRANT_LIMIT");
      }
      await tx.mediaUploadGrant.createMany({
        data: requests.map(request => ({
          authUserId: authUserId,
          storageKey: request.storageKey,
          mimeType: request.mimeType,
          maxBytes: request.size,
          expiresAt,
        })),
      });
    });
  } catch (error) {
    if (process.env.VERCEL_ENV !== "production") {
      console.warn("[media/upload] Autorizações ainda não migradas no ambiente de preview.");
      return { ok: true as const };
    }
    const message = error instanceof Error && error.message === "ACTIVE_GRANT_LIMIT"
      ? "Há muitos envios pendentes. Aguarde alguns minutos."
      : "Não foi possível autorizar os arquivos.";
    return { ok: false as const, message };
  }

  return { ok: true as const };
}
