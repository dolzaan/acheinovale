import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { notFound, permanentRedirect } from "next/navigation";
import { ListingShare } from "@/components/listing-share";
import { Header } from "@/components/header";
import { MobileNav } from "@/components/mobile-nav";
import { PropertyGallery } from "@/components/property-gallery";
import { UserAvatar } from "@/components/user-avatar";
import { FavoriteButton } from "@/components/favorite-button";
import { ListingReportForm } from "@/components/listing-report-form";
import { TrackedWhatsappContact } from "@/components/tracked-whatsapp-contact";
import { BathIcon, BedIcon, HomeIcon, PinIcon } from "@/components/icons";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db";
import { getPublicProperty } from "@/lib/listings/public";
import { PROPERTY_REPORT_REASONS } from "@/lib/listings/report-reasons";
import { reportProperty } from "../../actions";
import { propertyUrl } from "@/lib/listings/urls";
import { propertyImagePublicUrl, propertyVideoPublicUrl } from "@/lib/supabase/storage";
import { formatBrazilianPhone } from "@/lib/validation/profile";
import { SITE_URL } from "@/lib/site";
import { formatArea, formatCount } from "@/lib/format";
import { ADVERTISER_KIND_LABELS, advertiserDisplayName, advertiserUrl, isProfessionalAdvertiser } from "@/lib/listings/advertiser";

type Props = {
  params: Promise<{ publicCode: string; slug: string }>;
  searchParams: Promise<{ denuncia?: string }>;
};

const propertyTypes = {
  HOUSE: "Casa",
  APARTMENT: "Apartamento",
  STUDIO: "Kitnet / Studio",
  LAND: "Terreno",
  COMMERCIAL_ROOM: "Sala comercial",
  WAREHOUSE: "Galpão",
  OTHER: "Imóvel",
} as const;

function formatPrice(priceCents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(priceCents / 100);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { publicCode } = await params;
  const property = await getPublicProperty(publicCode);
  if (!property) return { title: "Imóvel não encontrado" };

  const canonical = `${SITE_URL}${propertyUrl(property)}`;
  return {
    title: `${property.title} | AcheiNoVale`,
    description: property.description.slice(0, 155),
    alternates: { canonical },
    robots: property.status === "ACTIVE" ? undefined : { index: false, follow: false },
    openGraph: {
      title: property.title,
      description: property.description.slice(0, 155),
      url: canonical,
      type: "website",
      // A imagem vem de opengraph-image.tsx: cartão com foto, preço e bairro.
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function PropertyPage({ params, searchParams }: Props) {
  const [{ publicCode, slug }, query] = await Promise.all([params, searchParams]);
  // Sem cookie de sessão, getCurrentUser retorna na hora; com sessão, roda junto com o anúncio.
  const [property, viewer] = await Promise.all([getPublicProperty(publicCode), getCurrentUser()]);
  if (!property) notFound();

  if (property.status !== "ACTIVE") {
    if (!viewer || (viewer.id !== property.ownerId && viewer.role !== "ADMIN")) {
      notFound();
    }
  }
  if (slug !== property.slug) permanentRedirect(propertyUrl(property));

  const isFavorite = viewer
    ? Boolean(await prisma.favorite.findFirst({ where: { userId: viewer.id, propertyId: property.id }, select: { id: true } }))
    : false;

  const canonical = `${SITE_URL}${propertyUrl(property)}`;
  const ownerProfileUrl = advertiserUrl(property.owner);
  const whatsappUrl = `https://wa.me/${property.whatsapp}?text=${encodeURIComponent(
    `Olá! Vi o imóvel "${property.title}" no AcheiNoVale.`,
  )}`;
  const propertyStructuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: property.title,
    description: property.description,
    image: property.images.map(image => propertyImagePublicUrl(image.storageKey)),
    category: propertyTypes[property.type],
    sku: property.publicCode,
    url: canonical,
    offers: {
      "@type": "Offer",
      priceCurrency: "BRL",
      price: property.priceCents / 100,
      availability: "https://schema.org/InStock",
      url: canonical,
    },
  };
  const breadcrumbStructuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: `Imóveis em ${property.city.name}`, item: `${SITE_URL}/${property.city.slug}/imoveis` },
      { "@type": "ListItem", position: 3, name: property.title, item: canonical },
    ],
  };

  return (
    <>
      <Script id={`property-${property.publicCode}-jsonld`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(propertyStructuredData) }} />
      <Script id={`property-${property.publicCode}-breadcrumbs`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbStructuredData) }} />
      <Header />
      <main id="conteudo" className="listing-detail-page">
        <div className="container listing-detail">
          {property.status !== "ACTIVE" ? (
            <div className="preview-notice">
              Prévia do proprietário — este anúncio ainda não está visível publicamente.
            </div>
          ) : null}

          {property.images.length || property.videos.length ? (
            <PropertyGallery
              title={property.title}
              images={property.images.map((photo, index) => ({ id: photo.id, src: propertyImagePublicUrl(photo.storageKey), alt: photo.altText || `${property.title} — foto ${index + 1}`, position: photo.position }))}
              videos={property.videos.map(video => ({ id: video.id, src: propertyVideoPublicUrl(video.storageKey), mimeType: video.mimeType, position: video.position }))}
            />
          ) : (
            <div className="listing-detail__hero listing-detail__hero--property"><HomeIcon size={58} /><span>Este anúncio ainda não possui fotos.</span></div>
          )}

          <div className="listing-detail__grid">
            <article className="listing-detail__content">
              <span className="listing-code">Código {property.publicCode.toUpperCase()}</span>
              <span className="listing-location"><PinIcon size={17} />{property.neighborhood.name}, {property.city.name} — {property.city.stateCode}</span>
              <h1>{property.title}</h1>
              <div className="listing-facts">
                <span>{propertyTypes[property.type]}</span>
                {property.bedrooms !== null ? <span><BedIcon />{formatCount(property.bedrooms, "quarto", "quartos")}</span> : null}
                {property.bathrooms !== null ? <span><BathIcon />{formatCount(property.bathrooms, "banheiro", "banheiros")}</span> : null}
                {property.parkingSpots !== null ? <span>{formatCount(property.parkingSpots, "vaga", "vagas")}</span> : null}
                {property.areaM2 ? <span>{formatArea(property.areaM2)}</span> : null}
              </div>
              <section className="listing-description">
                <h2>Sobre o imóvel</h2>
                <p>{property.description}</p>
              </section>
            </article>

            <aside className="listing-contact-card">
              <small>{property.purpose === "RENT" ? "Valor do aluguel" : "Valor de venda"}</small>
              <strong>{formatPrice(property.priceCents)}</strong>
              {property.purpose === "RENT" ? <span>por mês</span> : null}
              <div className="listing-contact-actions">
                <TrackedWhatsappContact kind="imoveis" publicCode={property.publicCode} whatsappUrl={whatsappUrl} className="button button--primary listing-contact-primary" />
                <ListingShare title={property.title} url={canonical} />
              </div>
              {property.status === "ACTIVE" ? <FavoriteButton kind="imovel" id={property.id} saved={isFavorite} /> : null}
              <div className="listing-owner">
                <UserAvatar image={property.owner.image} name={property.owner.name} />
                <div><small>{isProfessionalAdvertiser(property.owner) ? ADVERTISER_KIND_LABELS[property.owner.advertiserKind] : "Anunciante"}</small><b>{advertiserDisplayName(property.owner)}</b>{property.owner.creci ? <small>CRECI {property.owner.creci} (informado pelo anunciante)</small> : null}{ownerProfileUrl ? <Link prefetch={false} className="text-link" href={ownerProfileUrl}>Ver todos os imóveis →</Link> : null}</div>
              </div>
              <p>WhatsApp do anúncio: {formatBrazilianPhone(property.whatsapp)}</p>
              {viewer?.id !== property.ownerId ? <ListingReportForm action={reportProperty.bind(null, property.id)} reasons={PROPERTY_REPORT_REASONS} summary="Denunciar este anúncio" status={query.denuncia} /> : null}
            </aside>
          </div>
        </div>
      </main>
      <MobileNav />
    </>
  );
}
