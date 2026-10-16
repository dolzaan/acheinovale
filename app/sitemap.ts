import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { freighterUrl, propertyCatalogPath, propertyUrl } from "@/lib/listings/urls";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const cities = await prisma.city.findMany({
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
  });
  const properties = await prisma.property.findMany({
    where: { status: "ACTIVE" },
    select: { publicCode: true, slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });
  // Páginas por finalidade e bairro só entram quando têm anúncios ativos.
  const catalogGroups = await prisma.property.groupBy({
    by: ["cityId", "purpose", "neighborhoodId"],
    where: { status: "ACTIVE", city: { isActive: true }, neighborhood: { needsReview: false } },
  });
  const neighborhoods = await prisma.neighborhood.findMany({
    where: { id: { in: [...new Set(catalogGroups.map(group => group.neighborhoodId))] } },
    select: { id: true, slug: true },
  });
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
  const freighters = await prisma.freighterProfile.findMany({
    where: { status: "ACTIVE" },
    select: { publicCode: true, slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });

  return [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/imoveis`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/freteiros`, changeFrequency: "daily", priority: 0.8 },
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
    ...freighters.map(freighter => ({
      url: `${SITE_URL}${freighterUrl(freighter)}`,
      lastModified: freighter.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
