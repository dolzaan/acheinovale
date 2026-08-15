type PublicListing = {
  publicCode: string;
  slug: string;
};

export function propertyUrl(listing: PublicListing) {
  return `/imovel/${listing.publicCode}/${listing.slug}`;
}

export function freighterUrl(listing: PublicListing) {
  return `/freteiro/${listing.publicCode}/${listing.slug}`;
}
