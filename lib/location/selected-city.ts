import "server-only";

import { cache } from "react";
import { DEFAULT_CITY_SLUG, normalizeCitySlug } from "@/lib/location/city-preference";
import { getActiveCityBySlug } from "@/lib/listings/public-cache";

export const DEFAULT_CITY = { id: "", name: "Rio do Sul", slug: DEFAULT_CITY_SLUG } as const;

export const resolveActiveCity = cache(async (requestedSlug?: string) => {
  const slug = normalizeCitySlug(requestedSlug) || DEFAULT_CITY.slug;
  const city = await getActiveCityBySlug(slug);
  if (city || slug === DEFAULT_CITY.slug) return city ?? DEFAULT_CITY;

  return await getActiveCityBySlug(DEFAULT_CITY.slug) ?? DEFAULT_CITY;
});

export async function resolveRequestCity(requestedSlug?: string) {
  const explicitSlug = normalizeCitySlug(requestedSlug);
  return resolveActiveCity(explicitSlug);
}
