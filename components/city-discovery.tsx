import Link from "next/link";
import { Suspense } from "react";
import { getCitiesWithListings } from "@/lib/listings/public-cache";

type Category = "imoveis" | "freteiros";
type Props = { category: Category; currentSlug?: string };

// Fica no fim da página: com Suspense, o restante é enviado sem esperar esta consulta.
export function CityDiscovery(props: Props) {
  return <Suspense fallback={null}><CityDiscoveryLinks {...props} /></Suspense>;
}

async function CityDiscoveryLinks({ category, currentSlug }: Props) {
  const cities = await getCitiesWithListings(category);
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
