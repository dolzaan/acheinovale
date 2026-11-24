import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { cache } from "react";
import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { MobileNav } from "@/components/mobile-nav";
import { PropertyCard } from "@/components/property-card";
import { UserAvatar } from "@/components/user-avatar";
import { PinIcon } from "@/components/icons";
import { prisma } from "@/lib/db";
import { formatNumber } from "@/lib/format";
import { ADVERTISER_KIND_LABELS, advertiserDisplayName, isProfessionalAdvertiser } from "@/lib/listings/advertiser";
import { getPublicPropertiesPage } from "@/lib/listings/public-cache";
import { SITE_URL } from "@/lib/site";
import { SavedCityLink } from "@/components/saved-city-link";

type Props = { params: Promise<{ slug: string }> };

const MAX_LISTED_PROPERTIES = 60;

const getAdvertiser = cache(async (slug: string) => {
  const advertiser = await prisma.user.findUnique({
    where: { profileSlug: slug },
    select: {
      id: true,
      name: true,
      image: true,
      advertiserKind: true,
      businessName: true,
      creci: true,
      profileSlug: true,
      isBlocked: true,
      createdAt: true,
      city: { select: { name: true } },
    },
  });
  // Quem voltou a ser pessoa física, ou foi bloqueado, não tem mais página pública.
  if (!advertiser || advertiser.isBlocked || !isProfessionalAdvertiser(advertiser)) return null;
  return advertiser;
});

function loadProperties(ownerId: string) {
  return getPublicPropertiesPage(
    { ownerId, status: "ACTIVE", city: { isActive: true } },
    [{ publishedAt: "desc" }, { createdAt: "desc" }],
    0,
    MAX_LISTED_PROPERTIES,
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const advertiser = await getAdvertiser(slug);
  if (!advertiser) return { title: "Anunciante não encontrado" };
  const [, total] = await loadProperties(advertiser.id);
  const name = advertiserDisplayName(advertiser);
  const title = `${name} — imóveis | AcheiNoVale`;
  const description = `${ADVERTISER_KIND_LABELS[advertiser.advertiserKind]}${advertiser.city ? ` em ${advertiser.city.name}` : ""}. Veja os imóveis anunciados por ${name} no Achei no Vale.`;
  const canonical = `${SITE_URL}/anunciante/${advertiser.profileSlug}`;
  return {
    title,
    description,
    alternates: { canonical },
    robots: total ? undefined : { index: false, follow: true },
    openGraph: { title, description, url: canonical, type: "profile" },
  };
}

export default async function AdvertiserPage({ params }: Props) {
  const { slug } = await params;
  const advertiser = await getAdvertiser(slug);
  if (!advertiser) notFound();
  const [properties, total] = await loadProperties(advertiser.id);
  const name = advertiserDisplayName(advertiser);
  const canonical = `${SITE_URL}/anunciante/${advertiser.profileSlug}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": advertiser.advertiserKind === "AGENCY" ? "RealEstateAgent" : "Person",
    name,
    url: canonical,
    ...(advertiser.image ? { image: advertiser.image } : {}),
  };

  return (
    <>
      <Script id={`advertiser-${advertiser.profileSlug}-jsonld`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <Header />
      <main id="conteudo" className="catalog-page">
        <div className="container catalog-container">
          <section className="advertiser-header">
            <UserAvatar image={advertiser.image} name={name} size="lg" />
            <div>
              <span className="property-card__purpose">{ADVERTISER_KIND_LABELS[advertiser.advertiserKind]}</span>
              <h1>{name}</h1>
              <p>
                {advertiser.city ? <span><PinIcon size={15} />{advertiser.city.name}</span> : null}
                {advertiser.creci ? <span>CRECI {advertiser.creci} <small>(informado pelo anunciante)</small></span> : null}
                <span>No Achei no Vale desde {new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(advertiser.createdAt)}</span>
              </p>
            </div>
          </section>

          <div className="catalog-results-bar">
            <p><strong>{formatNumber(total)}</strong> {total === 1 ? "imóvel anunciado" : "imóveis anunciados"}{total > properties.length ? <small> · exibindo os {properties.length} mais recentes</small> : null}</p>
          </div>

          {properties.length ? (
            <div className="property-grid catalog-grid">
              {properties.map(property => <PropertyCard key={property.id} property={property} />)}
            </div>
          ) : (
            <div className="empty-state catalog-empty">
              <strong>Nenhum imóvel ativo no momento.</strong>
              <p>Os anúncios de {name} aparecem aqui assim que forem aprovados.</p>
              <SavedCityLink className="button button--secondary" href="/imoveis">Ver outros imóveis</SavedCityLink>
            </div>
          )}
        </div>
      </main>
      <MobileNav />
    </>
  );
}
