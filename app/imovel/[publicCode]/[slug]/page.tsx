import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { Header } from "@/components/header";
import { MobileNav } from "@/components/mobile-nav";
import { PropertyGallery } from "@/components/property-gallery";
import { UserAvatar } from "@/components/user-avatar";
import { BathIcon, BedIcon, HomeIcon, PinIcon } from "@/components/icons";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getPublicProperty } from "@/lib/listings/public";
import { propertyUrl } from "@/lib/listings/urls";
import { propertyImagePublicUrl, propertyVideoPublicUrl } from "@/lib/supabase/storage";
import { formatBrazilianPhone } from "@/lib/validation/profile";

type Props = {
  params: Promise<{ publicCode: string; slug: string }>;
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

  const canonical = `https://acheinovale.vercel.app${propertyUrl(property)}`;
  return {
    title: `${property.title} | AcheiNoVale`,
    description: property.description.slice(0, 155),
    alternates: { canonical },
    robots: property.status === "ACTIVE" ? undefined : { index: false, follow: false },
  };
}

export default async function PropertyPage({ params }: Props) {
  const { publicCode, slug } = await params;
  const property = await getPublicProperty(publicCode);
  if (!property) notFound();

  if (property.status !== "ACTIVE") {
    const viewer = await getCurrentUser();
    if (!viewer || (viewer.id !== property.ownerId && viewer.role !== "ADMIN")) {
      notFound();
    }
  }

  if (slug !== property.slug) permanentRedirect(propertyUrl(property));

  const whatsappUrl = `https://wa.me/${property.whatsapp}?text=${encodeURIComponent(`Olá! Vi o imóvel ${property.publicCode.toUpperCase()} no AcheiNoVale.`)}`;

  return (
    <>
      <Header />
      <main className="listing-detail-page">
        <div className="container listing-detail">
          {property.status !== "ACTIVE" ? (
            <div className="preview-notice">
              Prévia do proprietário — este anúncio ainda não está visível publicamente.
            </div>
          ) : null}

          {property.images.length || property.videos.length ? (
            <PropertyGallery
              title={property.title}
              images={property.images.map((photo, index) => ({ id: photo.id, src: propertyImagePublicUrl(photo.storageKey), alt: photo.altText || `${property.title} — foto ${index + 1}` }))}
              videos={property.videos.map(video => ({ id: video.id, src: propertyVideoPublicUrl(video.storageKey), mimeType: video.mimeType }))}
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
                {property.bedrooms !== null ? <span><BedIcon />{property.bedrooms} quartos</span> : null}
                {property.bathrooms !== null ? <span><BathIcon />{property.bathrooms} banheiros</span> : null}
                {property.parkingSpots !== null ? <span>{property.parkingSpots} vagas</span> : null}
                {property.areaM2 ? <span>{property.areaM2.toString()} m²</span> : null}
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
              <a className="button button--primary" href={whatsappUrl} target="_blank" rel="noreferrer">Conversar no WhatsApp</a>
              <div className="listing-owner">
                <UserAvatar image={property.owner.image} name={property.owner.name} />
                <div><small>Anunciante</small><b>{property.owner.name || "Usuário do AcheiNoVale"}</b></div>
              </div>
              <p>WhatsApp do anúncio: {formatBrazilianPhone(property.whatsapp)}</p>
            </aside>
          </div>
        </div>
      </main>
      <MobileNav />
    </>
  );
}
