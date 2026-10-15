import type { Metadata } from "next";
import Script from "next/script";
import { notFound } from "next/navigation";
import FreightersPage from "@/app/freteiros/page";
import { prisma } from "@/lib/db";
import { SITE_URL } from "@/lib/site";

type Props = {
  params: Promise<{ cidade: string }>;
  searchParams: Promise<{ q?: string }>;
};

async function getCity(slug: string) {
  return prisma.city.findFirst({
    where: { slug, isActive: true },
    select: { name: true, slug: true },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { cidade } = await params;
  const city = await getCity(cidade);
  if (!city) return {};
  const description = `Fretes, mudanças, entregas e transportes em ${city.name}.`;
  return {
    title: `Freteiros em ${city.name} | AcheiNoVale`,
    description,
    alternates: { canonical: `${SITE_URL}/${city.slug}/freteiros` },
    openGraph: { title: `Freteiros em ${city.name} | AcheiNoVale`, description },
  };
}

export default async function CityFreightersPage({ params, searchParams }: Props) {
  const [{ cidade }, filters] = await Promise.all([params, searchParams]);
  const city = await getCity(cidade);
  if (!city) notFound();
  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Freteiros em " + city.name, item: `${SITE_URL}/${city.slug}/freteiros` },
    ],
  };
  return <><Script id="breadcrumbs-freteiros-cidade" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} /><FreightersPage searchParams={Promise.resolve({ ...filters, cidade: city.slug })} prettyPath /></>;
}
