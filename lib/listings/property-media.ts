import "server-only";

import { prisma } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  isSupportedProfileImage,
  propertyMediaPublicUrl,
  PROPERTY_IMAGE_LIMIT,
  PROPERTY_IMAGE_MAX_BYTES,
  PROPERTY_IMAGE_MIME_TYPES,
  PROPERTY_VIDEO_MAX_BYTES,
  PROPERTY_VIDEO_MIME_TYPES,
  STORAGE_BUCKETS,
} from "@/lib/supabase/storage";

export type StoredMediaOrderItem = {
  kind: "image" | "video";
  storageKey: string;
};

export function isPropertyImageKey(key: string, authUserId: string) {
  return new RegExp(`^${authUserId}/properties/[a-f0-9-]+\\.(jpg|png|webp|avif)$`, "i").test(key);
}

export function isPropertyVideoKey(key: string, authUserId: string) {
  return new RegExp(`^${authUserId}/properties/[a-f0-9-]+\\.(mp4|webm|mov|m4v)$`, "i").test(key);
}

export function parseImageKeys(value: string, authUserId: string) {
  try {
    const parsed: unknown = JSON.parse(value || "[]");
    if (!Array.isArray(parsed) || parsed.length > PROPERTY_IMAGE_LIMIT) return null;
    const keys = parsed.filter((key): key is string => typeof key === "string");
    if (keys.length !== parsed.length || new Set(keys).size !== keys.length || keys.some(key => !isPropertyImageKey(key, authUserId))) return null;
    return keys;
  } catch {
    return null;
  }
}

export function parseVideoKey(value: string, authUserId: string) {
  if (!value) return "";
  return isPropertyVideoKey(value, authUserId) ? value : null;
}

export function parseStoredMediaOrder(value: string, imageKeys: string[], videoKey: string, authUserId: string) {
  try {
    const parsed: unknown = JSON.parse(value || "[]");
    if (!Array.isArray(parsed) || parsed.length !== imageKeys.length + (videoKey ? 1 : 0)) return null;
    const items: StoredMediaOrderItem[] = [];
    for (const candidate of parsed) {
      if (!candidate || typeof candidate !== "object") return null;
      const kind = "kind" in candidate ? candidate.kind : null;
      const storageKey = "storageKey" in candidate ? candidate.storageKey : null;
      if ((kind !== "image" && kind !== "video") || typeof storageKey !== "string") return null;
      if (kind === "image" ? !isPropertyImageKey(storageKey, authUserId) : !isPropertyVideoKey(storageKey, authUserId)) return null;
      items.push({ kind, storageKey });
    }
    const expected = new Set([...imageKeys, ...(videoKey ? [videoKey] : [])]);
    const received = items.map(item => item.storageKey);
    if (new Set(received).size !== received.length || received.some(key => !expected.has(key))) return null;
    if (imageKeys.length && items[0]?.kind !== "image") return null;
    return items;
  } catch {
    return null;
  }
}

export function videoMimeTypeFromKey(key: string) {
  if (key.toLowerCase().endsWith(".webm")) return "video/webm";
  if (key.toLowerCase().endsWith(".mov")) return "video/quicktime";
  if (key.toLowerCase().endsWith(".m4v")) return "video/x-m4v";
  return "video/mp4";
}

export async function releasePropertyMediaUploadGrants(keys: string[]) {
  if (!keys.length) return;
  try {
    await prisma.mediaUploadGrant.deleteMany({ where: { storageKey: { in: keys } } });
  } catch (error) {
    console.warn("[media/upload] Não foi possível liberar autorizações.", {
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function removePropertyMedia(keys: string[]) {
  if (!keys.length) return;
  const { error } = await createAdminClient().storage.from(STORAGE_BUCKETS.properties).remove(keys);
  await releasePropertyMediaUploadGrants(keys);
  if (error) throw error;
}

async function readMediaHeader(key: string) {
  const url = propertyMediaPublicUrl(key);
  if (!url) return null;
  try {
    const response = await fetch(url, {
      headers: { Range: "bytes=0-31" },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;
    const reader = response.body?.getReader();
    if (!reader) return null;
    const { value } = await reader.read();
    await reader.cancel();
    return value ? value.slice(0, 32) : null;
  } catch {
    return null;
  }
}

function isSupportedVideoHeader(bytes: Uint8Array, mimeType: string) {
  if (mimeType === "video/webm") {
    return bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3;
  }
  return new TextDecoder().decode(bytes.slice(4, 8)) === "ftyp";
}

export async function verifyPropertyImages(keys: string[], authUserId: string) {
  if (!keys.length) return true;
  const folder = `${authUserId}/properties`;
  const storage = createAdminClient().storage.from(STORAGE_BUCKETS.properties);
  const checks = await Promise.all(keys.map(async key => {
    const name = key.slice(folder.length + 1);
    const { data, error } = await storage.list(folder, { limit: 2, search: name });
    if (error) return false;
    const file = data?.find(candidate => candidate.name === name);
    const metadata = file?.metadata as { size?: number; mimetype?: string } | undefined;
    const mimeType = metadata?.mimetype;
    if (
      !file || !metadata?.size || metadata.size > PROPERTY_IMAGE_MAX_BYTES ||
      !mimeType || !PROPERTY_IMAGE_MIME_TYPES.includes(mimeType as (typeof PROPERTY_IMAGE_MIME_TYPES)[number])
    ) return false;
    const bytes = await readMediaHeader(key);
    return Boolean(bytes && isSupportedProfileImage(bytes, mimeType));
  }));
  return checks.every(Boolean);
}

export async function verifyPropertyVideo(key: string, authUserId: string) {
  if (!key) return true;
  const folder = `${authUserId}/properties`;
  const name = key.slice(folder.length + 1);
  const { data, error } = await createAdminClient().storage.from(STORAGE_BUCKETS.properties).list(folder, { limit: 2, search: name });
  if (error) return false;
  const file = data?.find(candidate => candidate.name === name);
  const metadata = file?.metadata as { size?: number; mimetype?: string } | undefined;
  const mimeType = metadata?.mimetype;
  if (
    !file || !metadata?.size || metadata.size > PROPERTY_VIDEO_MAX_BYTES ||
    !mimeType || !PROPERTY_VIDEO_MIME_TYPES.includes(mimeType as (typeof PROPERTY_VIDEO_MIME_TYPES)[number])
  ) return false;
  const bytes = await readMediaHeader(key);
  return Boolean(bytes && isSupportedVideoHeader(bytes, mimeType));
}
