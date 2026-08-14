export const STORAGE_BUCKETS = {
  properties: "property-images",
  freighters: "freighter-images",
} as const;

export function createStoragePath(userId: string, originalName: string) {
  const extension = originalName.split(".").pop()?.toLowerCase() || "jpg";
  const safeExtension = /^[a-z0-9]{2,5}$/.test(extension) ? extension : "jpg";
  return `${userId}/${crypto.randomUUID()}.${safeExtension}`;
}
