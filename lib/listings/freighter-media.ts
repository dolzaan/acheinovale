import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  freighterImagePublicUrl,
  isSupportedProfileImage,
  PROPERTY_IMAGE_MAX_BYTES,
  PROPERTY_IMAGE_MIME_TYPES,
  STORAGE_BUCKETS,
} from "@/lib/supabase/storage";

export function isFreighterImageKey(key: string, authUserId: string) {
  const prefix = `${authUserId}/freighters/`;
  if (!key.startsWith(prefix)) return false;
  return /^[a-f0-9-]+\.(jpg|png|webp|avif)$/i.test(key.slice(prefix.length));
}

async function readImageHeader(key: string) {
  const url = freighterImagePublicUrl(key);
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

export async function verifyFreighterImages(keys: string[], authUserId: string) {
  if (!keys.length) return true;
  const folder = `${authUserId}/freighters`;
  const storage = createAdminClient().storage.from(STORAGE_BUCKETS.freighters);
  const checks = await Promise.all(keys.map(async key => {
    if (!isFreighterImageKey(key, authUserId)) return false;
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
    const bytes = await readImageHeader(key);
    return Boolean(bytes && isSupportedProfileImage(bytes, mimeType));
  }));
  return checks.every(Boolean);
}

export async function removeFreighterImages(keys: string[]) {
  if (!keys.length) return;
  const { error } = await createAdminClient().storage.from(STORAGE_BUCKETS.freighters).remove(keys);
  if (error) throw error;
}
