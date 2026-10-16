import "server-only";

import { checkRateLimit } from "@/lib/security/rate-limit";

export type ListingEventType = "view" | "whatsapp";

export async function readListingEvent(request: Request): Promise<ListingEventType | null> {
  const body = await request.json().catch(() => null) as { type?: unknown } | null;
  return body?.type === "view" || body?.type === "whatsapp" ? body.type : null;
}

/** Limita eventos repetidos do mesmo IP para que a métrica não seja inflada. */
export async function allowListingEvent(request: Request, scope: string, listingId: string, type: ListingEventType) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const rateLimit = await checkRateLimit({
    scope,
    identifier: `${forwarded || "sem-ip"}:${listingId}:${type}`,
    limit: type === "view" ? 4 : 12,
    windowSeconds: 60 * 60,
  });
  return rateLimit.allowed;
}

export function metricDay() {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

export function metricCounters(type: ListingEventType) {
  return {
    create: { views: type === "view" ? 1 : 0, whatsappClicks: type === "whatsapp" ? 1 : 0 },
    update: type === "view" ? { views: { increment: 1 } } : { whatsappClicks: { increment: 1 } },
  };
}
