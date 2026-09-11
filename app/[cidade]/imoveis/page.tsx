import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PropertiesPage from "@/app/imoveis/page";
import { prisma } from "@/lib/db";

type Props = {
  params: Promise<{ cidade: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
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
  const description = `Casas, apartamentos e terrenos para venda ou aluguel em ${city.name}.`;
  return {
    title: `Imóveis em ${city.name} | AcheiNoVale`,
    description,
    alternates: { canonical: `https://acheinovale.vercel.app/${city.slug}/imoveis` },
    openGraph: { title: `Imóveis em ${city.name} | AcheiNoVale`, description },
  };
}

export default async function CityPropertiesPage({ params, searchParams }: Props) {
  const [{ cidade }, filters] = await Promise.all([params, searchParams]);
  const city = await getCity(cidade);
  if (!city) notFound();
  return <PropertiesPage searchParams={Promise.resolve({ ...filters, cidade: city.slug })} />;
}
