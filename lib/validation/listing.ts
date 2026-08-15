export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 70);
}

export function uniqueSlug(value: string) {
  return `${slugify(value) || "anuncio"}-${crypto.randomUUID().slice(0, 8)}`;
}

export function createPublicCode() {
  return `anv-${crypto.randomUUID().replaceAll("-", "").slice(0, 10)}`;
}

export function propertySlug(title: string, neighborhood: string, city: string) {
  return slugify(`${title} ${neighborhood} ${city}`) || "imovel-no-vale";
}

export function freighterSlug(displayName: string, city: string) {
  return slugify(`${displayName} ${city}`) || "freteiro-no-vale";
}

export function parseMoneyToCents(value: string) {
  const normalized = value.replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  const amount = Number(normalized);
  const cents = Math.round(amount * 100);
  return Number.isSafeInteger(cents) && cents > 0 && cents <= 2_000_000_000 ? cents : null;
}
