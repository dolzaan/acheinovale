export const CITY_COOKIE_NAME = "achei_no_vale_city";
export const CITY_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
export const DEFAULT_CITY_SLUG = "rio-do-sul";

export function normalizeCitySlug(value?: string | null) {
  const slug = value?.trim().toLowerCase() ?? "";
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length <= 80
    ? slug
    : undefined;
}

/**
 * Cidade usada nos links do cabeçalho: a que a página está mostrando manda; sem ela, vale a
 * cidade salva no cookie; sem nenhuma, a padrão.
 */
export function pickCitySlug(pageCity?: string | null, savedCity?: string | null) {
  return normalizeCitySlug(pageCity) ?? normalizeCitySlug(savedCity) ?? DEFAULT_CITY_SLUG;
}
