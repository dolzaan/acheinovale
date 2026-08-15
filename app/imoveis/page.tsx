import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { MobileNav } from "@/components/mobile-nav";
import { BathIcon, BedIcon, HomeIcon, PinIcon, SearchIcon } from "@/components/icons";
import { prisma } from "@/lib/db";
import { propertyUrl } from "@/lib/listings/urls";

export const metadata: Metadata = {
  title: "Imóveis em Rio do Sul | AcheiNoVale",
  description: "Casas, apartamentos, terrenos e imóveis para venda ou aluguel em Rio do Sul e região.",
  alternates: { canonical: "https://acheinovale.vercel.app/imoveis" },
};

type Props = { searchParams: Promise<{ q?: string; finalidade?: string }> };

function formatPrice(priceCents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(priceCents / 100);
}

export default async function PropertiesPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = params.q?.trim().slice(0, 80) || "";
  const purpose = params.finalidade === "aluguel" ? "RENT" : params.finalidade === "venda" ? "SALE" : undefined;
  const properties = await prisma.property.findMany({
    where: {
      status: "ACTIVE", city: { slug: "rio-do-sul", isActive: true }, ...(purpose ? { purpose } : {}),
      ...(query ? { OR: [{ title: { contains: query, mode: "insensitive" } }, { description: { contains: query, mode: "insensitive" } }, { neighborhood: { name: { contains: query, mode: "insensitive" } } }] } : {}),
    },
    include: { city: true, neighborhood: true }, orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }], take: 48,
  });

  return <><Header/><main className="catalog-page"><div className="container catalog-container">
    <div className="catalog-heading"><div><span className="section-kicker">Rio do Sul e região</span><h1>Imóveis</h1><p>Encontre casas, apartamentos e terrenos publicados por pessoas da região.</p></div><Link className="button button--primary" href="/publicar/imovel">Anunciar imóvel</Link></div>
    <form className="catalog-filter" action="/imoveis"><label className="catalog-filter__search"><SearchIcon size={19}/><input name="q" defaultValue={query} placeholder="Buscar por bairro ou característica" aria-label="Buscar imóveis"/></label><select name="finalidade" defaultValue={params.finalidade || ""} aria-label="Finalidade"><option value="">Venda e aluguel</option><option value="venda">Comprar</option><option value="aluguel">Alugar</option></select><button className="button button--primary" type="submit">Buscar</button></form>
    {properties.length ? <div className="property-grid catalog-grid">{properties.map(property => <article className="property-card" key={property.id}><Link className="catalog-image-placeholder" href={propertyUrl(property)} aria-label={`Ver ${property.title}`}><HomeIcon size={42}/><span>Ver imóvel</span></Link><div className="property-card__body"><span className="property-card__location"><PinIcon size={15}/>{property.neighborhood.name}, {property.city.name}</span><h3><Link href={propertyUrl(property)}>{property.title}</Link></h3><div className="property-card__features">{property.bedrooms !== null ? <span><BedIcon/>{property.bedrooms} quartos</span> : null}{property.bathrooms !== null ? <span><BathIcon/>{property.bathrooms} banh.</span> : null}{property.areaM2 ? <span>{property.areaM2.toString()} m²</span> : null}</div><div className="property-card__price"><strong>{formatPrice(property.priceCents)}</strong><span>{property.purpose === "RENT" ? "/mês" : ""}</span></div><small className="catalog-code">{property.publicCode.toUpperCase()}</small></div></article>)}</div> : <div className="empty-state catalog-empty"><strong>Nenhum imóvel encontrado.</strong><p>Os anúncios aprovados aparecerão aqui. Retire os filtros ou publique o primeiro imóvel.</p><Link className="button button--primary" href="/publicar/imovel">Publicar imóvel</Link></div>}
  </div></main><MobileNav/></>;
}
