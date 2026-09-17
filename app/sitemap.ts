import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { freighterUrl, propertyUrl } from "@/lib/listings/urls";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const cities = await prisma.city.findMany({
    where: { isActive: true },
    select: { slug: true },
    orderBy: { name: "asc" },
  });
  const properties = await prisma.property.findMany({
    where: { status: "ACTIVE" },
    select: { publicCode: true, slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });
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
      { url: `${SITE_URL}/${city.slug}/imoveis`, changeFrequency: "daily" as const, priority: 0.9 },
      { url: `${SITE_URL}/${city.slug}/freteiros`, changeFrequency: "daily" as const, priority: 0.8 },
    ]),
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
