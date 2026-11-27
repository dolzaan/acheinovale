type ListingState = { status: string; publishedAt: Date | null };

// Quando a moderação pausa um anúncio, `publishedAt` é zerado: ele só volta ao ar com
// nova aprovação. O dono só reativa o que ele mesmo pausou (ou que pausou por inatividade).
export function ownerCanReactivate(listing: ListingState) {
  return listing.status === "PAUSED" && listing.publishedAt !== null;
}

export function ownerCanTogglePause(listing: ListingState) {
  return listing.status === "ACTIVE" || ownerCanReactivate(listing);
}

/** O que gravar quando a moderação decide; a pausa da moderação tira o anúncio de publicado. */
export function moderationPublishedAt(intent: "approve" | "reject" | "pause", current: Date | null, now = new Date()) {
  if (intent === "approve") return current ?? now;
  if (intent === "pause") return null;
  return current;
}
