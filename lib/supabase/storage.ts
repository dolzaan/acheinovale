export const STORAGE_BUCKETS = {
  profiles: "profile-images",
  properties: "property-images",
  freighters: "freighter-images",
} as const;

export const PROFILE_IMAGE_MAX_BYTES = 4 * 1024 * 1024;
export const PROFILE_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

const PROFILE_IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
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
