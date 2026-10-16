import "server-only";

import { cache } from "react";
import { prisma } from "@/lib/db";
import { SITE_URL } from "@/lib/site";
import { propertyCatalogPath, type PurposeSlug } from "@/lib/listings/urls";

export type CatalogFilters = Record<string, string | undefined>;

export const getCatalogCity = cache((slug: string) => prisma.city.findFirst({
  where: { slug, isActive: true },
  select: { id: true, name: true, slug: true },
}));

export const getCatalogNeighborhood = cache((cityId: string, slug: string) => prisma.neighborhood.findFirst({
  where: { cityId, slug, needsReview: false },
  select: { id: true, name: true, slug: true },
}));

export const countCatalogProperties = cache((cityId: string, purposeSlug: PurposeSlug, neighborhoodId?: string) => prisma.property.count({
  where: { status: "ACTIVE", cityId, purpose: purposeSlug === "aluguel" ? "RENT" : "SALE", ...(neighborhoodId ? { neighborhoodId } : {}) },
}));

/** Monta o caminho canônico mantendo na query os filtros que não fazem parte do caminho. */
export function catalogPathWithFilters(citySlug: string, purposeSlug: PurposeSlug | undefined, neighborhoodSlug: string | undefined, filters: CatalogFilters) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value && !["cidade", "finalidade", "bairro", "alerta"].includes(key) && !(key === "ordem" && value === "recentes")) query.set(key, value);
  }
  const path = propertyCatalogPath(citySlug, purposeSlug, purposeSlug ? neighborhoodSlug : undefined);
  const search = query.toString();
  return search ? `${path}?${search}` : path;
}

export function purposeWords(purposeSlug: PurposeSlug) {
  return purposeSlug === "aluguel"
    ? { title: "para alugar", crumb: "Para alugar" }
    : { title: "à venda", crumb: "À venda" };
}

export function catalogBreadcrumbs(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "Início", path: "" }, ...items].map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}
