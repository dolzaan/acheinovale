import type { Metadata } from "next";
import Script from "next/script";
import { notFound, permanentRedirect } from "next/navigation";
import PropertiesPage from "@/app/imoveis/page";
import { catalogBreadcrumbs, catalogPathWithFilters, getCatalogCity, type CatalogFilters } from "@/lib/listings/catalog-pages";
import { isPurposeSlug } from "@/lib/listings/urls";
import { SITE_URL } from "@/lib/site";

type Props = {
  params: Promise<{ cidade: string }>;
  searchParams: Promise<CatalogFilters>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { cidade } = await params;
  const city = await getCatalogCity(cidade);
  if (!city) return {};
  const description = `Casas, apartamentos e terrenos para venda ou aluguel em ${city.name}.`;
  return {
    title: `Imóveis em ${city.name} | AcheiNoVale`,
    description,
    alternates: { canonical: `${SITE_URL}/${city.slug}/imoveis` },
    openGraph: { title: `Imóveis em ${city.name} | AcheiNoVale`, description },
  };
}

export default async function CityPropertiesPage({ params, searchParams }: Props) {
  const [{ cidade }, filters] = await Promise.all([params, searchParams]);
  const city = await getCatalogCity(cidade);
  if (!city) notFound();
  // Links antigos com ?finalidade= passam a usar o caminho próprio da finalidade.
  if (isPurposeSlug(filters.finalidade)) permanentRedirect(catalogPathWithFilters(city.slug, filters.finalidade, filters.bairro, filters));

  const breadcrumbs = catalogBreadcrumbs([{ name: `Imóveis em ${city.name}`, path: `/${city.slug}/imoveis` }]);
  return <><Script id="breadcrumbs-imoveis-cidade" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} /><PropertiesPage searchParams={Promise.resolve({ ...filters, cidade: city.slug })} prettyPath /></>;
}
