import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

const SITE_URL = "https://acheinovale.vercel.app";
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const cities = await prisma.city.findMany({
    where: { isActive: true },
    select: { slug: true },
    orderBy: { name: "asc" },
  });

  return [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    ...cities.flatMap(city => [
      { url: `${SITE_URL}/${city.slug}/imoveis`, changeFrequency: "daily" as const, priority: 0.9 },
      { url: `${SITE_URL}/${city.slug}/freteiros`, changeFrequency: "daily" as const, priority: 0.8 },
    ]),
  ];
}
