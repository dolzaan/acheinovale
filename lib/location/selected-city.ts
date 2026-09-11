import "server-only";

import { cache } from "react";
import { prisma } from "@/lib/db";

export const DEFAULT_CITY = { id: "", name: "Rio do Sul", slug: "rio-do-sul" } as const;

export const resolveActiveCity = cache(async (requestedSlug?: string) => {
  const slug = requestedSlug?.trim().slice(0, 80) || DEFAULT_CITY.slug;
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
