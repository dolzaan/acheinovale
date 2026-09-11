import type { Metadata } from "next";
import { notFound } from "next/navigation";
import FreightersPage from "@/app/freteiros/page";
import { prisma } from "@/lib/db";

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
    alternates: { canonical: `https://acheinovale.vercel.app/${city.slug}/freteiros` },
    openGraph: { title: `Freteiros em ${city.name} | AcheiNoVale`, description },
  };
}

export default async function CityFreightersPage({ params, searchParams }: Props) {
  const [{ cidade }, filters] = await Promise.all([params, searchParams]);
  const city = await getCity(cidade);
  if (!city) notFound();
  return <FreightersPage searchParams={Promise.resolve({ ...filters, cidade: city.slug })} />;
}
