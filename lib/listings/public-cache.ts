import "server-only";

import { revalidateTag, unstable_cache } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { measureServerOperation } from "@/lib/performance/timing";

const PUBLIC_LOCATIONS_TAG = "public-locations";
const PUBLIC_LISTINGS_TAG = "public-listings";
const PUBLIC_DATA_REVALIDATE_SECONDS = 15 * 60;
const LOCATION_REVALIDATE_SECONDS = 24 * 60 * 60;
const DATABASE_RECOVERY_DELAY_MS = 30 * 1000;
const MAX_LAST_KNOWN_GOOD_ENTRIES = 100;

type PublicCacheRuntimeState = {
  lastKnownGood: Map<string, unknown>;
  databaseUnavailableUntil: number;
};

const globalForPublicCache = globalThis as typeof globalThis & {
  acheiNoValePublicCache?: PublicCacheRuntimeState;
};

const runtimeState = globalForPublicCache.acheiNoValePublicCache ?? {
  lastKnownGood: new Map<string, unknown>(),
  databaseUnavailableUntil: 0,
};

globalForPublicCache.acheiNoValePublicCache = runtimeState;

function isTransientDatabaseError(error: unknown) {
  const code = typeof error === "object" && error !== null && "code" in error
    ? String(error.code)
    : "";
  const message = error instanceof Error ? error.message : String(error);
  return code === "P1001" || code === "P2024" || /connection pool|can't reach database server/i.test(message);
}

function rememberLastKnownGood<T>(key: string, value: T) {
  if (!runtimeState.lastKnownGood.has(key) && runtimeState.lastKnownGood.size >= MAX_LAST_KNOWN_GOOD_ENTRIES) {
    const oldestKey = runtimeState.lastKnownGood.keys().next().value;
    if (oldestKey) runtimeState.lastKnownGood.delete(oldestKey);
  }
  runtimeState.lastKnownGood.set(key, value);
}

async function loadPublicData<T>(key: string, loader: () => Promise<T>, emptyValue: () => T): Promise<T> {
  const previousValue = runtimeState.lastKnownGood.get(key) as T | undefined;

  if (runtimeState.databaseUnavailableUntil > Date.now()) {
    return previousValue ?? emptyValue();
  }

  try {
    const value = await loader();
    rememberLastKnownGood(key, value);
    runtimeState.databaseUnavailableUntil = 0;
    return value;
  } catch (error) {
    if (!isTransientDatabaseError(error)) throw error;

    runtimeState.databaseUnavailableUntil = Date.now() + DATABASE_RECOVERY_DELAY_MS;
    console.warn(JSON.stringify({
      level: "warning",
      message: "serving_last_known_public_data",
      cacheKey: key,
      hasPreviousValue: previousValue !== undefined,
      retryAfterMs: DATABASE_RECOVERY_DELAY_MS,
    }));
    return previousValue ?? emptyValue();
  }
}

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

const getCachedActiveCityBySlug = unstable_cache(
  async (slug: string) => measureServerOperation("city.find_active_by_slug", () => prisma.city.findFirst({
    where: { slug, isActive: true },
    select: { id: true, name: true, slug: true },
  })),
  ["active-city-by-slug-v1"],
  { revalidate: LOCATION_REVALIDATE_SECONDS, tags: [PUBLIC_LOCATIONS_TAG] },
);

export function getActiveCityBySlug(slug: string) {
  return loadPublicData(`city:${slug}`, () => getCachedActiveCityBySlug(slug), () => null);
}

const getCachedActiveCityOptions = unstable_cache(
  async () => measureServerOperation("city.list_active", () => prisma.city.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true, stateCode: true },
  })),
  ["active-city-options-v1"],
  { revalidate: LOCATION_REVALIDATE_SECONDS, tags: [PUBLIC_LOCATIONS_TAG] },
);

export function getActiveCityOptions() {
  return loadPublicData("city-options", getCachedActiveCityOptions, () => []);
}

const getCachedActiveLocations = unstable_cache(
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

export function getActiveLocations() {
  return loadPublicData("locations", getCachedActiveLocations, () => []);
}

const getCachedHomeListings = unstable_cache(
  async (cityId: string) => measureServerOperation("home.public_listings", async () => {
    const [properties, freighters] = await Promise.all([
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
    ]);
    return [properties, freighters] as const;
  }),
  ["home-public-listings-v1"],
  { revalidate: PUBLIC_DATA_REVALIDATE_SECONDS, tags: [PUBLIC_LISTINGS_TAG] },
);

export function getHomeListings(cityId: string) {
  return loadPublicData<Awaited<ReturnType<typeof getCachedHomeListings>>>(
    `home:${cityId}`,
    () => getCachedHomeListings(cityId),
    () => [[], []],
  );
}

const getCachedPublicPropertiesPage = unstable_cache(
  async (
    where: Prisma.PropertyWhereInput,
    orderBy: Prisma.PropertyOrderByWithRelationInput[],
    skip: number,
    take: number,
  ) => measureServerOperation("property.list_public", async () => {
    const [properties, resultCount] = await Promise.all([
      prisma.property.findMany({
        where,
        select: propertyCardSelect,
        orderBy,
        skip,
        take,
      }),
      prisma.property.count({ where }),
    ]);
    return [properties, resultCount] as const;
  }),
  ["public-properties-page-v1"],
  { revalidate: PUBLIC_DATA_REVALIDATE_SECONDS, tags: [PUBLIC_LISTINGS_TAG] },
);

export function getPublicPropertiesPage(
  where: Prisma.PropertyWhereInput,
  orderBy: Prisma.PropertyOrderByWithRelationInput[],
  skip: number,
  take: number,
) {
  const cacheKey = `properties:${JSON.stringify([where, orderBy, skip, take])}`;
  return loadPublicData<Awaited<ReturnType<typeof getCachedPublicPropertiesPage>>>(
    cacheKey,
    () => getCachedPublicPropertiesPage(where, orderBy, skip, take),
    () => [[], 0],
  );
}

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
  const cacheKey = `freighters:${JSON.stringify([cityId, citySlug, query, skip, take])}`;
  return loadPublicData<Awaited<ReturnType<typeof queryFreighters>>>(
    cacheKey,
    () => query
      ? queryFreighters(cityId, citySlug, query, skip, take)
      : getCachedFreighters(cityId, citySlug, skip, take),
    () => [],
  );
}

export function revalidatePublicListings() {
  revalidateTag(PUBLIC_LISTINGS_TAG, "max");
}

export function revalidatePublicLocations() {
  revalidateTag(PUBLIC_LOCATIONS_TAG, "max");
}
