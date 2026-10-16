import type { Metadata } from "next";
import Script from "next/script";
import { notFound, permanentRedirect } from "next/navigation";
import PropertiesPage from "@/app/imoveis/page";
import { catalogBreadcrumbs, catalogPathWithFilters, getCatalogCity, purposeWords, type CatalogFilters } from "@/lib/listings/catalog-pages";
import { isPurposeSlug, propertyCatalogPath } from "@/lib/listings/urls";
import { SITE_URL } from "@/lib/site";

type Props = {
  params: Promise<{ cidade: string; finalidade: string }>;
  searchParams: Promise<CatalogFilters>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { cidade, finalidade } = await params;
  const city = isPurposeSlug(finalidade) ? await getCatalogCity(cidade) : null;
  if (!city || !isPurposeSlug(finalidade)) return {};
  const words = purposeWords(finalidade);
  const title = `Imóveis ${words.title} em ${city.name}, SC | Achei no Vale`;
  const description = finalidade === "aluguel"
    ? `Encontre casas, apartamentos e imóveis para alugar em ${city.name}. Veja fotos, preços, bairros e fale direto com o anunciante.`
    : `Encontre casas, apartamentos e terrenos à venda em ${city.name}. Veja fotos, preços, bairros e fale direto com o anunciante.`;
  const canonical = `${SITE_URL}${propertyCatalogPath(city.slug, finalidade)}`;
  return { title, description, alternates: { canonical }, openGraph: { title, description, url: canonical, type: "website" } };
}

export default async function CityPurposePropertiesPage({ params, searchParams }: Props) {
  const [{ cidade, finalidade }, filters] = await Promise.all([params, searchParams]);
  if (!isPurposeSlug(finalidade)) notFound();
  const city = await getCatalogCity(cidade);
  if (!city) notFound();
  if (filters.bairro || (filters.finalidade && filters.finalidade !== finalidade)) {
    permanentRedirect(catalogPathWithFilters(city.slug, isPurposeSlug(filters.finalidade) ? filters.finalidade : finalidade, filters.bairro, filters));
  }

  const breadcrumbs = catalogBreadcrumbs([
    { name: `Imóveis em ${city.name}`, path: propertyCatalogPath(city.slug) },
    { name: `${purposeWords(finalidade).crumb} em ${city.name}`, path: propertyCatalogPath(city.slug, finalidade) },
  ]);
  return (
    <>
      <Script id={`breadcrumbs-imoveis-${city.slug}-${finalidade}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
      <PropertiesPage searchParams={Promise.resolve({ ...filters, cidade: city.slug, finalidade })} prettyPath />
    </>
  );
}
