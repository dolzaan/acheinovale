import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { CITY_COOKIE_NAME, normalizeCitySlug } from "@/lib/location/city-preference";

export const DEFAULT_CITY = { id: "", name: "Rio do Sul", slug: "rio-do-sul" } as const;

export const resolveActiveCity = cache(async (requestedSlug?: string) => {
  const slug = normalizeCitySlug(requestedSlug) || DEFAULT_CITY.slug;
  const city = await prisma.city.findFirst({
    where: { slug, isActive: true },
    select: { id: true, name: true, slug: true },
  });
  if (city || slug === DEFAULT_CITY.slug) return city ?? DEFAULT_CITY;

  return await prisma.city.findFirst({
    where: { slug: DEFAULT_CITY.slug, isActive: true },
    select: { id: true, name: true, slug: true },
  }) ?? DEFAULT_CITY;
});

export async function resolveRequestCity(requestedSlug?: string) {
  const explicitSlug = normalizeCitySlug(requestedSlug);
  if (explicitSlug) return resolveActiveCity(explicitSlug);

  const cookieStore = await cookies();
  return resolveActiveCity(cookieStore.get(CITY_COOKIE_NAME)?.value);
}
