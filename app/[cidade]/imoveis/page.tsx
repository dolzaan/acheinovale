import type { Metadata } from "next";
import Script from "next/script";
import { notFound, permanentRedirect } from "next/navigation";
import PropertiesPage from "@/app/imoveis/page";
import { catalogBreadcrumbs, catalogPathWithFilters, getCatalogCity, type CatalogFilters } from "@/lib/listings/catalog-pages";
import { isPurposeSlug } from "@/lib/listings/urls";
import { SITE_URL } from "@/lib/site";
import { jsonLd } from "@/lib/seo/json-ld";

type Props = {
  params: Promise<{ cidade: string }>;
  searchParams: Promise<CatalogFilters>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { cidade } = await params;
  const city = await getCatalogCity(cidade);
  if (!city) return {};
  const description = `Encontre casas, apartamentos e terrenos para alugar ou comprar em ${city.name}, SC. Compare preços e fale diretamente com os anunciantes.`;
  const canonical = `${SITE_URL}/${city.slug}/imoveis`;
  return {
    title: `Imóveis em ${city.name}, SC: aluguel e venda | Achei no Vale`,
    description,
    alternates: { canonical },
    openGraph: { title: `Imóveis em ${city.name}, SC: aluguel e venda | Achei no Vale`, description, url: canonical },
  };
}

export default async function CityPropertiesPage({ params, searchParams }: Props) {
  const [{ cidade }, filters] = await Promise.all([params, searchParams]);
  const city = await getCatalogCity(cidade);
  if (!city) notFound();
  // Links antigos com ?finalidade= passam a usar o caminho próprio da finalidade.
  if (isPurposeSlug(filters.finalidade)) permanentRedirect(catalogPathWithFilters(city.slug, filters.finalidade, filters.bairro, filters));

  const breadcrumbs = catalogBreadcrumbs([{ name: `Imóveis em ${city.name}`, path: `/${city.slug}/imoveis` }]);
  return <><Script id="breadcrumbs-imoveis-cidade" type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbs) }} /><PropertiesPage searchParams={Promise.resolve({ ...filters, cidade: city.slug })} prettyPath /></>;
}
