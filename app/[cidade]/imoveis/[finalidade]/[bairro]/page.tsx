import type { Metadata } from "next";
import Script from "next/script";
import { notFound } from "next/navigation";
import PropertiesPage from "@/app/imoveis/page";
import { catalogBreadcrumbs, countCatalogProperties, getCatalogCity, getCatalogNeighborhood, purposeWords, type CatalogFilters } from "@/lib/listings/catalog-pages";
import { isPurposeSlug, propertyCatalogPath } from "@/lib/listings/urls";
import { SITE_URL } from "@/lib/site";

type Props = {
  params: Promise<{ cidade: string; finalidade: string; bairro: string }>;
  searchParams: Promise<CatalogFilters>;
};

async function resolve(cidade: string, finalidade: string, bairro: string) {
  if (!isPurposeSlug(finalidade)) return null;
  const city = await getCatalogCity(cidade);
  const neighborhood = city ? await getCatalogNeighborhood(city.id, bairro) : null;
  return city && neighborhood ? { city, neighborhood, finalidade } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { cidade, finalidade, bairro } = await params;
  const resolved = await resolve(cidade, finalidade, bairro);
  if (!resolved) return {};
  const { city, neighborhood } = resolved;
  const words = purposeWords(resolved.finalidade);
  const title = `Imóveis ${words.title} no ${neighborhood.name}, ${city.name} | Achei no Vale`;
  const description = `Casas, apartamentos e outros imóveis ${words.title} no bairro ${neighborhood.name}, em ${city.name} (SC). Veja fotos, preços e fale direto com o anunciante.`;
  const canonical = `${SITE_URL}${propertyCatalogPath(city.slug, resolved.finalidade, neighborhood.slug)}`;
  // Bairro sem anúncios ativos não deve ser indexado como página vazia.
  const activeCount = await countCatalogProperties(city.id, resolved.finalidade, neighborhood.id);
  return {
    title,
    description,
    alternates: { canonical },
    robots: activeCount ? undefined : { index: false, follow: true },
    openGraph: { title, description, url: canonical, type: "website" },
  };
}

export default async function NeighborhoodPropertiesPage({ params, searchParams }: Props) {
  const [{ cidade, finalidade, bairro }, filters] = await Promise.all([params, searchParams]);
  const resolved = await resolve(cidade, finalidade, bairro);
  if (!resolved) notFound();
  const { city, neighborhood } = resolved;

  const breadcrumbs = catalogBreadcrumbs([
    { name: `Imóveis em ${city.name}`, path: propertyCatalogPath(city.slug) },
    { name: `${purposeWords(resolved.finalidade).crumb} em ${city.name}`, path: propertyCatalogPath(city.slug, resolved.finalidade) },
    { name: neighborhood.name, path: propertyCatalogPath(city.slug, resolved.finalidade, neighborhood.slug) },
  ]);
  return (
    <>
      <Script id={`breadcrumbs-imoveis-${city.slug}-${resolved.finalidade}-${neighborhood.slug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
      <PropertiesPage searchParams={Promise.resolve({ ...filters, cidade: city.slug, finalidade: resolved.finalidade, bairro: neighborhood.slug })} prettyPath />
    </>
  );
}
