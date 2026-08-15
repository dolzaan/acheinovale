export const STORAGE_BUCKETS = {
  profiles: "profile-images",
  properties: "property-images",
  freighters: "freighter-images",
} as const;

export const PROFILE_IMAGE_MAX_BYTES = 4 * 1024 * 1024;
export const PROPERTY_IMAGE_MAX_BYTES = 6 * 1024 * 1024;
export const PROPERTY_IMAGE_LIMIT = 10;
export const PROPERTY_VIDEO_MAX_BYTES = 50 * 1024 * 1024;
export const PROPERTY_VIDEO_LIMIT = 1;
export const PROFILE_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;
export const PROPERTY_IMAGE_MIME_TYPES = PROFILE_IMAGE_MIME_TYPES;
export const PROPERTY_VIDEO_MIME_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-m4v",
] as const;

const PROFILE_IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

const PROPERTY_VIDEO_EXTENSIONS: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
  "video/x-m4v": "m4v",
};

export function createStoragePath(userId: string, originalName: string) {
  const extension = originalName.split(".").pop()?.toLowerCase() || "jpg";
  const safeExtension = /^[a-z0-9]{2,5}$/.test(extension) ? extension : "jpg";
  return `${userId}/${crypto.randomUUID()}.${safeExtension}`;
}

export function createProfileImagePath(authUserId: string, mimeType: string) {
  const extension = PROFILE_IMAGE_EXTENSIONS[mimeType] ?? "jpg";
  return `${authUserId}/profile/${crypto.randomUUID()}.${extension}`;
}

export function createPropertyImagePath(authUserId: string, mimeType: string) {
  const extension = PROFILE_IMAGE_EXTENSIONS[mimeType] ?? "jpg";
  return `${authUserId}/properties/${crypto.randomUUID()}.${extension}`;
}

export function createPropertyVideoPath(authUserId: string, mimeType: string) {
  const extension = PROPERTY_VIDEO_EXTENSIONS[mimeType] ?? "mp4";
  return `${authUserId}/properties/${crypto.randomUUID()}.${extension}`;
}

export function propertyMediaPublicUrl(storageKey: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!baseUrl) return "";
  const encodedPath = storageKey.split("/").map(encodeURIComponent).join("/");
  return `${baseUrl}/storage/v1/object/public/${STORAGE_BUCKETS.properties}/${encodedPath}`;
}

export function propertyImagePublicUrl(storageKey: string) {
  return propertyMediaPublicUrl(storageKey);
}

export function propertyVideoPublicUrl(storageKey: string) {
  return propertyMediaPublicUrl(storageKey);
}

export function propertyVideoUploadEndpoint() {
  const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!configuredUrl) throw new Error("Supabase não configurado.");
  const projectRef = new URL(configuredUrl).hostname.split(".")[0];
  if (!projectRef) throw new Error("Projeto Supabase inválido.");
  return `https://${projectRef}.storage.supabase.co/storage/v1/upload/resumable`;
}

export function isSupportedProfileImage(bytes: Uint8Array, mimeType: string) {
  if (!PROFILE_IMAGE_MIME_TYPES.includes(mimeType as (typeof PROFILE_IMAGE_MIME_TYPES)[number])) {
    return false;
  }

  if (mimeType === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }

  if (mimeType === "image/png") {
    return (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47
    );
  }

  if (mimeType === "image/webp") {
    return (
      new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" &&
      new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP"
    );
  }

  const avifHeader = new TextDecoder().decode(bytes.slice(4, 16));
  return avifHeader.startsWith("ftyp") && /avif|avis/.test(avifHeader);
}

export function profileImagePathFromPublicUrl(url: string | null) {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    const marker = `/storage/v1/object/public/${STORAGE_BUCKETS.profiles}/`;
    const markerIndex = parsed.pathname.indexOf(marker);
    return markerIndex === -1
      ? null
      : decodeURIComponent(parsed.pathname.slice(markerIndex + marker.length));
  } catch {
    return null;
  }
}
