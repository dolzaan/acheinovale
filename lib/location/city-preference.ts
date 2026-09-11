export const CITY_COOKIE_NAME = "achei_no_vale_city";
export const CITY_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function normalizeCitySlug(value?: string | null) {
  const slug = value?.trim().toLowerCase() ?? "";
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length <= 80
    ? slug
    : undefined;
}
