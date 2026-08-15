import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import {
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

export async function removePropertyMedia(keys: string[]) {
  if (!keys.length) return;
  const { error } = await createAdminClient().storage.from(STORAGE_BUCKETS.properties).remove(keys);
  if (error) throw error;
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
    return Boolean(file && metadata?.size && metadata.size <= PROPERTY_IMAGE_MAX_BYTES && metadata.mimetype && PROPERTY_IMAGE_MIME_TYPES.includes(metadata.mimetype as (typeof PROPERTY_IMAGE_MIME_TYPES)[number]));
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
  return Boolean(file && metadata?.size && metadata.size <= PROPERTY_VIDEO_MAX_BYTES && metadata.mimetype && PROPERTY_VIDEO_MIME_TYPES.includes(metadata.mimetype as (typeof PROPERTY_VIDEO_MIME_TYPES)[number]));
}
