import type { AdvertiserKind } from "@prisma/client";
import { slugify } from "@/lib/validation/listing";

export const ADVERTISER_KIND_LABELS: Record<AdvertiserKind, string> = {
  INDIVIDUAL: "Pessoa física",
  BROKER: "Corretor(a) de imóveis",
  AGENCY: "Imobiliária",
};

const ADVERTISER_KINDS: readonly AdvertiserKind[] = ["INDIVIDUAL", "BROKER", "AGENCY"];

export function parseAdvertiserKind(value: string): AdvertiserKind | null {
  return ADVERTISER_KINDS.includes(value as AdvertiserKind) ? value as AdvertiserKind : null;
}

type AdvertiserIdentity = {
  name: string | null;
  advertiserKind: AdvertiserKind;
  businessName: string | null;
  profileSlug: string | null;
};

export function isProfessionalAdvertiser(advertiser: Pick<AdvertiserIdentity, "advertiserKind">) {
  return advertiser.advertiserKind !== "INDIVIDUAL";
}

/** Nome mostrado nos anúncios: o nome comercial de corretor e imobiliária, senão o nome da conta. */
export function advertiserDisplayName(advertiser: AdvertiserIdentity) {
  const businessName = isProfessionalAdvertiser(advertiser) ? advertiser.businessName?.trim() : "";
  return businessName || advertiser.name?.trim() || "Usuário do AcheiNoVale";
}

/** Perfil público só existe para corretor e imobiliária: pessoa física não tem os anúncios reunidos. */
export function advertiserUrl(advertiser: Pick<AdvertiserIdentity, "advertiserKind" | "profileSlug">) {
  return isProfessionalAdvertiser(advertiser) && advertiser.profileSlug ? `/anunciante/${advertiser.profileSlug}` : null;
}

/**
 * CRECI como o anunciante digitou, só com letras, números, hífen e barra (ex.: "12345-J", "SC 12345").
 * Vazio é permitido; formato estranho devolve null para o formulário recusar.
 */
export function normalizeCreci(value: string): string | null | undefined {
  const compact = value.trim().toUpperCase().replace(/\s+/g, " ");
  if (!compact) return undefined;
  return /^[A-Z0-9][A-Z0-9 /-]{2,19}$/.test(compact) && /\d{3,}/.test(compact) ? compact : null;
}

export function profileSlugBase(name: string) {
  return slugify(name).slice(0, 60) || "anunciante";
}
