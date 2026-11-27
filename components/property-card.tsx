import Image from "next/image";
import Link from "next/link";
import type { PropertyPurpose, PropertyType } from "@prisma/client";
import { AreaIcon, BathIcon, BedIcon, HomeIcon, PinIcon } from "@/components/icons";
import { formatArea, formatCount } from "@/lib/format";
import { propertyUrl } from "@/lib/listings/urls";
import { propertyImagePublicUrl } from "@/lib/supabase/storage";

const propertyTypeLabels: Record<PropertyType, string> = {
  HOUSE: "Casa",
  APARTMENT: "Apartamento",
  STUDIO: "Kitnet / Studio",
  LAND: "Terreno",
  COMMERCIAL_ROOM: "Sala comercial",
  WAREHOUSE: "Galpão",
  OTHER: "Outro",
};

export type PropertyCardProperty = {
  id: string;
  publicCode: string;
  slug: string;
  title: string;
  purpose: PropertyPurpose;
  type: PropertyType;
  priceCents: number;
  bedrooms: number | null;
  bathrooms: number | null;
  areaM2: number | { toString(): string } | null;
  city: { name: string };
  neighborhood: { name: string };
  images: Array<{ storageKey: string; altText: string | null }>;
};

function formatPrice(priceCents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(priceCents / 100);
}

/** Mesmo card do catálogo de imóveis. */
export function PropertyCard({ property }: { property: PropertyCardProperty }) {
  const url = propertyUrl(property);
  const cover = property.images[0];
  return (
    <article className="property-card">
      <Link prefetch={false} className={cover ? "catalog-property-image" : "catalog-image-placeholder"} href={url} aria-label={`Ver ${property.title}`}>
        {cover
          ? <Image src={propertyImagePublicUrl(cover.storageKey)} alt={cover.altText || property.title} fill sizes="(max-width: 680px) 100vw, (max-width: 1000px) 50vw, 33vw" />
          : <><HomeIcon size={42} /><span>Ver imóvel</span></>}
      </Link>
      <div className="property-card__body">
        <span className="property-card__purpose">{property.purpose === "RENT" ? "Aluguel" : "Venda"} · {propertyTypeLabels[property.type]}</span>
        <span className="property-card__location"><PinIcon size={15} />{property.neighborhood.name}, {property.city.name}</span>
        <h3><Link prefetch={false} href={url}>{property.title}</Link></h3>
        <div className="property-card__features">
          {property.bedrooms !== null ? <span><BedIcon />{formatCount(property.bedrooms, "quarto", "quartos")}</span> : null}
          {property.bathrooms !== null ? <span><BathIcon />{property.bathrooms} banh.</span> : null}
          {property.areaM2 ? <span><AreaIcon />{formatArea(property.areaM2)}</span> : null}
        </div>
        <div className="property-card__price"><strong>{formatPrice(property.priceCents)}</strong><span>{property.purpose === "RENT" ? "/mês" : ""}</span></div>
        <Link prefetch={false} className="button button--primary property-card__cta" href={url} aria-label={`Ver imóvel: ${property.title}`}>Ver imóvel</Link>
        <small className="catalog-code">{property.publicCode.toUpperCase()}</small>
      </div>
    </article>
  );
}
