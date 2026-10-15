import Link from "next/link";
import { prisma } from "@/lib/db";

type Category = "imoveis" | "freteiros";

export async function CityDiscovery({ category, currentSlug }: { category: Category; currentSlug?: string }) {
  const cities = await prisma.city.findMany({
    where: {
      isActive: true,
      ...(category === "imoveis"
        ? { properties: { some: { status: "ACTIVE" } } }
        : { freighterProfiles: { some: { status: "ACTIVE" } } }),
    },
    select: { name: true, slug: true },
    orderBy: { name: "asc" },
    take: 50,
  });
  const alternatives = cities.filter(city => city.slug !== currentSlug).slice(0, 12);
  if (!alternatives.length) return null;
  return (
    <section className="container" aria-label={category === "imoveis" ? "Imóveis em outras cidades" : "Freteiros em outras cidades"} style={{ paddingBlock: "2rem" }}>
      <h2>{category === "imoveis" ? "Explore imóveis em outras cidades" : "Encontre freteiros em outras cidades"}</h2>
      <p>Veja anúncios publicados em outras cidades do Alto Vale do Itajaí.</p>
      <nav aria-label="Outras cidades com anúncios" style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginTop: "1rem" }}>
        {alternatives.map(city => (
          <Link key={city.slug} href={`/${city.slug}/${category}`} className="button button--secondary">
            {city.name}
          </Link>
        ))}
      </nav>
    </section>
  );
}
