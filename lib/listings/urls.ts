type PublicListing = {
  publicCode: string;
  slug: string;
};

export function propertyUrl(listing: PublicListing) {
  return `/imovel/${listing.publicCode}/${listing.slug}`;
}

export type PurposeSlug = "aluguel" | "venda";

export function isPurposeSlug(value: string | undefined): value is PurposeSlug {
  return value === "aluguel" || value === "venda";
}

/** Caminho canônico do catálogo: /cidade/imoveis[/aluguel|venda[/bairro]]. */
export function propertyCatalogPath(citySlug: string, purposeSlug?: PurposeSlug, neighborhoodSlug?: string) {
  return `/${citySlug}/imoveis${purposeSlug ? `/${purposeSlug}${neighborhoodSlug ? `/${neighborhoodSlug}` : ""}` : ""}`;
}

export function freighterUrl(listing: PublicListing) {
  return `/freteiro/${listing.publicCode}/${listing.slug}`;
}
