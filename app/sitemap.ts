import type { MetadataRoute } from "next";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { PUBLIC_LISTINGS_TAG, PUBLIC_LOCATIONS_TAG } from "@/lib/listings/public-cache";
import { freighterUrl, propertyCatalogPath, propertyUrl } from "@/lib/listings/urls";
import { SITE_URL } from "@/lib/site";

// Continua dinâmico para o build não depender do banco; os dados ficam em cache
// por 1h e são renovados junto com os anúncios, em vez de 5 consultas por acesso de robô.
export const dynamic = "force-dynamic";

const getSitemapData = unstable_cache(async () => {
  // No máximo duas consultas por vez, para caber no pool de 2 conexões (lib/db.ts).
  const [cities, properties] = await Promise.all([
    prisma.city.findMany({
      where: { isActive: true },
      select: {
        id: true,
        slug: true,
        _count: {
          select: {
            properties: { where: { status: "ACTIVE" } },
            freighterProfiles: { where: { status: "ACTIVE" } },
          },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.property.findMany({
      where: { status: "ACTIVE" },
      select: { publicCode: true, slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);
  // Páginas por finalidade e bairro só entram quando têm anúncios ativos.
  const [catalogGroups, freighters] = await Promise.all([
    prisma.property.groupBy({
      by: ["cityId", "purpose", "neighborhoodId"],
      where: { status: "ACTIVE", city: { isActive: true }, neighborhood: { needsReview: false } },
    }),
    prisma.freighterProfile.findMany({
      where: { status: "ACTIVE" },
      select: { publicCode: true, slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);
  const [neighborhoods, advertisers] = await Promise.all([
    prisma.neighborhood.findMany({
      where: { id: { in: [...new Set(catalogGroups.map(group => group.neighborhoodId))] } },
      select: { id: true, slug: true },
    }),
    // Perfis de corretor e imobiliária com pelo menos um imóvel ativo.
    prisma.user.findMany({
      where: {
        advertiserKind: { not: "INDIVIDUAL" },
        profileSlug: { not: null },
        isBlocked: false,
        properties: { some: { status: "ACTIVE" } },
      },
      select: { profileSlug: true },
    }),
  ]);
  // O cache guarda JSON: as datas viram texto aqui para o tipo refletir isso.
  return {
    cities,
    catalogGroups,
    neighborhoods,
    advertiserSlugs: advertisers.map(advertiser => advertiser.profileSlug).filter((slug): slug is string => Boolean(slug)),
    properties: properties.map(({ updatedAt, ...property }) => ({ ...property, updatedAt: updatedAt.toISOString() })),
    freighters: freighters.map(({ updatedAt, ...freighter }) => ({ ...freighter, updatedAt: updatedAt.toISOString() })),
  };
}, ["sitemap-data-v2"], { revalidate: 60 * 60, tags: [PUBLIC_LISTINGS_TAG, PUBLIC_LOCATIONS_TAG] });

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { cities, properties, catalogGroups, neighborhoods, freighters, advertiserSlugs } = await getSitemapData();
  const citySlugById = new Map(cities.map(city => [city.id, city.slug]));
  const neighborhoodSlugById = new Map(neighborhoods.map(neighborhood => [neighborhood.id, neighborhood.slug]));
  const catalogPaths = new Set<string>();
  for (const group of catalogGroups) {
    const citySlug = citySlugById.get(group.cityId);
    const neighborhoodSlug = neighborhoodSlugById.get(group.neighborhoodId);
    if (!citySlug) continue;
    const purposeSlug = group.purpose === "RENT" ? "aluguel" : "venda";
    catalogPaths.add(propertyCatalogPath(citySlug, purposeSlug));
    if (neighborhoodSlug) catalogPaths.add(propertyCatalogPath(citySlug, purposeSlug, neighborhoodSlug));
  }
  return [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/imoveis`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/freteiros`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/anuncie`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/seguranca`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/ajuda`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/termos`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/privacidade`, changeFrequency: "yearly", priority: 0.3 },
    ...cities.flatMap(city => [
      ...(city._count.properties > 0
        ? [{ url: `${SITE_URL}/${city.slug}/imoveis`, changeFrequency: "daily" as const, priority: 0.9 }]
        : []),
      ...(city._count.freighterProfiles > 0
        ? [{ url: `${SITE_URL}/${city.slug}/freteiros`, changeFrequency: "daily" as const, priority: 0.8 }]
        : []),
    ]),
    ...[...catalogPaths].map(path => ({
      url: `${SITE_URL}${path}`,
      changeFrequency: "daily" as const,
      priority: path.split("/").length > 4 ? 0.7 : 0.85,
    })),
    ...properties.map(property => ({
      url: `${SITE_URL}${propertyUrl(property)}`,
      lastModified: property.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...advertiserSlugs.map(slug => ({
      url: `${SITE_URL}/anunciante/${slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...freighters.map(freighter => ({
      url: `${SITE_URL}${freighterUrl(freighter)}`,
      lastModified: freighter.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
