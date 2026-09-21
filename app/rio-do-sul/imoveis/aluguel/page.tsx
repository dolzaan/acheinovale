import type { Metadata } from "next";
import Script from "next/script";
import PropertiesPage from "@/app/imoveis/page";
import { SITE_URL } from "@/lib/site";

const canonical = `${SITE_URL}/rio-do-sul/imoveis/aluguel`;
const title = "Imóveis para alugar em Rio do Sul, SC | Achei no Vale";
const description =
  "Encontre casas, apartamentos e imóveis para alugar em Rio do Sul. Veja fotos, preços, bairros e fale direto com o anunciante.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical },
  openGraph: {
    title,
    description,
    url: canonical,
    type: "website",
  },
};

type Props = {
  searchParams: Promise<Record<string, string | undefined>>;
};

const breadcrumbStructuredData = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Início", item: SITE_URL },
    {
      "@type": "ListItem",
      position: 2,
      name: "Imóveis em Rio do Sul",
      item: `${SITE_URL}/rio-do-sul/imoveis`,
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "Imóveis para alugar em Rio do Sul",
      item: canonical,
    },
  ],
};

export default async function RioDoSulRentalsPage({ searchParams }: Props) {
  const filters = await searchParams;

  return (
    <>
      <Script
        id="rio-do-sul-rentals-breadcrumbs"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbStructuredData) }}
      />
      <PropertiesPage
        searchParams={Promise.resolve({
          ...filters,
          cidade: "rio-do-sul",
          finalidade: "aluguel",
        })}
      />
    </>
  );
}
