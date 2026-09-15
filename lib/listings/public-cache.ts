import "server-only";

import { revalidateTag, unstable_cache } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { measureServerOperation } from "@/lib/performance/timing";

const PUBLIC_LOCATIONS_TAG = "public-locations";
const PUBLIC_LISTINGS_TAG = "public-listings";
const PUBLIC_DATA_REVALIDATE_SECONDS = 60;
const LOCATION_REVALIDATE_SECONDS = 60 * 60;

const propertyCardSelect = {
  id: true,
  publicCode: true,
  slug: true,
  title: true,
  purpose: true,
  type: true,
  priceCents: true,
  bedrooms: true,
  bathrooms: true,
  areaM2: true,
  city: { select: { id: true, name: true, slug: true } },
  neighborhood: { select: { id: true, name: true, slug: true } },
  images: {
    orderBy: { position: "asc" as const },
    take: 1,
    select: { id: true, storageKey: true, altText: true },
  },
} satisfies Prisma.PropertySelect;

const freighterCardSelect = {
  id: true,
  publicCode: true,
  slug: true,
  displayName: true,
  description: true,
  priceNote: true,
  updatedAt: true,
  city: { select: { id: true, name: true, slug: true } },
  user: { select: { image: true } },
  images: {
    orderBy: { position: "asc" as const },
    take: 1,
    select: { id: true, storageKey: true, altText: true },
  },
  services: {
    orderBy: { name: "asc" as const },
    select: { id: true, name: true, slug: true },
  },
  reviews: {
    where: { isVisible: true },
    select: { rating: true },
  },
} satisfies Prisma.FreighterProfileSelect;

export const getActiveCityBySlug = unstable_cache(
  async (slug: string) => measureServerOperation("city.find_active_by_slug", () => prisma.city.findFirst({
    where: { slug, isActive: true },
    select: { id: true, name: true, slug: true },
  })),
  ["active-city-by-slug-v1"],
  { revalidate: LOCATION_REVALIDATE_SECONDS, tags: [PUBLIC_LOCATIONS_TAG] },
);

export const getActiveCityOptions = unstable_cache(
  async () => measureServerOperation("city.list_active", () => prisma.city.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true, stateCode: true },
  })),
  ["active-city-options-v1"],
  { revalidate: LOCATION_REVALIDATE_SECONDS, tags: [PUBLIC_LOCATIONS_TAG] },
);

export const getActiveLocations = unstable_cache(
  async () => measureServerOperation("city.list_with_neighborhoods", () => prisma.city.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      stateCode: true,
      neighborhoods: {
        orderBy: { name: "asc" },
        select: { id: true, name: true, slug: true },
      },
    },
  })),
  ["active-locations-v1"],
  { revalidate: LOCATION_REVALIDATE_SECONDS, tags: [PUBLIC_LOCATIONS_TAG] },
);

export const getHomeListings = unstable_cache(
  async (cityId: string) => measureServerOperation("home.public_listings", () => Promise.all([
    prisma.property.findMany({
      where: { status: "ACTIVE", cityId },
      select: propertyCardSelect,
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 3,
    }),
    prisma.freighterProfile.findMany({
      where: { status: "ACTIVE", cityId },
      select: freighterCardSelect,
      orderBy: { updatedAt: "desc" },
      take: 3,
    }),
  ])),
  ["home-public-listings-v1"],
  { revalidate: PUBLIC_DATA_REVALIDATE_SECONDS, tags: [PUBLIC_LISTINGS_TAG] },
);

export const getPublicPropertiesPage = unstable_cache(
  async (
    where: Prisma.PropertyWhereInput,
    orderBy: Prisma.PropertyOrderByWithRelationInput[],
    skip: number,
    take: number,
  ) => measureServerOperation("property.list_public", () => Promise.all([
    prisma.property.findMany({
      where,
      select: propertyCardSelect,
      orderBy,
      skip,
      take,
    }),
    prisma.property.count({ where }),
  ])),
  ["public-properties-page-v1"],
  { revalidate: PUBLIC_DATA_REVALIDATE_SECONDS, tags: [PUBLIC_LISTINGS_TAG] },
);

async function queryFreighters(cityId: string, citySlug: string, query: string, skip: number, take: number) {
  const cityMatch: Prisma.FreighterProfileWhereInput = {
    OR: [
      { cityId },
      { services: { some: { slug: `atende-${citySlug}` } } },
    ],
  };

  const profiles = await measureServerOperation("freighter.list_public", () => prisma.freighterProfile.findMany({
    where: {
      status: "ACTIVE",
      AND: [
        cityMatch,
        ...(query ? [{
          OR: [
            { displayName: { contains: query, mode: "insensitive" as const } },
            { description: { contains: query, mode: "insensitive" as const } },
            { services: { some: { name: { contains: query, mode: "insensitive" as const } } } },
          ],
        }] : []),
      ],
    },
    select: freighterCardSelect,
    orderBy: { updatedAt: "desc" },
    skip,
    take,
  }));

  return profiles.map(({ updatedAt, ...profile }) => ({
    ...profile,
    updatedAtMs: updatedAt.getTime(),
  }));
}

const getCachedFreighters = unstable_cache(
  (cityId: string, citySlug: string, skip: number, take: number) => queryFreighters(cityId, citySlug, "", skip, take),
  ["public-freighters-by-city-v1"],
  { revalidate: PUBLIC_DATA_REVALIDATE_SECONDS, tags: [PUBLIC_LISTINGS_TAG] },
);

export function getPublicFreighters(cityId: string, citySlug: string, query: string, skip: number, take: number) {
  return query
    ? queryFreighters(cityId, citySlug, query, skip, take)
    : getCachedFreighters(cityId, citySlug, skip, take);
}

export function revalidatePublicListings() {
  revalidateTag(PUBLIC_LISTINGS_TAG, "max");
}

export function revalidatePublicLocations() {
  revalidateTag(PUBLIC_LOCATIONS_TAG, "max");
}
