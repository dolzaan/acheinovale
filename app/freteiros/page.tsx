import type { Metadata } from "next";
import Link from "next/link";
import Form from "next/form";
import { Header } from "@/components/header";
import { MobileNav } from "@/components/mobile-nav";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { PinIcon, SearchIcon, StarIcon, TruckIcon } from "@/components/icons";
import { prisma } from "@/lib/db";
import { freighterUrl } from "@/lib/listings/urls";

export const metadata: Metadata = { title: "Freteiros em Rio do Sul | AcheiNoVale", description: "Fretes, mudanças, entregas e transportes em Rio do Sul e no Alto Vale do Itajaí.", alternates: { canonical: "https://acheinovale.vercel.app/freteiros" } };
type Props = { searchParams: Promise<{ q?: string; disponivel?: string }> };

export default async function FreightersPage({ searchParams }: Props) {
  const params = await searchParams; const query = params.q?.trim().slice(0, 80) || ""; const availableToday = params.disponivel === "hoje";
  const freighters = await prisma.freighterProfile.findMany({
    where: { status: "ACTIVE", city: { slug: "rio-do-sul", isActive: true }, ...(availableToday ? { availableToday: true } : {}), ...(query ? { OR: [{ displayName: { contains: query, mode: "insensitive" } }, { description: { contains: query, mode: "insensitive" } }, { services: { some: { name: { contains: query, mode: "insensitive" } } } }] } : {}) },
    include: { city: true, services: { orderBy: { name: "asc" } }, reviews: { where: { isVisible: true }, select: { rating: true } } }, orderBy: [{ availableToday: "desc" }, { updatedAt: "desc" }], take: 48,
  });
  return <><Header/><main className="catalog-page"><div className="container catalog-container">
    <div className="catalog-heading"><div><span className="section-kicker section-kicker--orange">Profissionais locais</span><h1>Freteiros</h1><p>Encontre ajuda para mudanças, entregas e transportes em Rio do Sul e região.</p></div><Link className="button button--primary" href="/publicar/frete">Divulgar meus fretes</Link></div>
    <Form className="catalog-filter" action="/freteiros"><label className="catalog-filter__search"><SearchIcon size={19}/><input name="q" defaultValue={query} placeholder="Ex: mudança, entrega ou bairro" aria-label="Buscar freteiros"/></label><label className="catalog-filter__check"><input type="checkbox" name="disponivel" value="hoje" defaultChecked={availableToday}/><span>Disponível hoje</span></label><PendingSubmitButton className="button button--primary" pendingText="Buscando..." navigation>Buscar</PendingSubmitButton></Form>
    {freighters.length ? <div className="freighter-grid catalog-grid">{freighters.map(freighter => { const rating = freighter.reviews.length ? freighter.reviews.reduce((sum, review) => sum + review.rating, 0) / freighter.reviews.length : null; return <article className="freighter-card" key={freighter.id}><div className="freighter-card__top"><div className="freighter-avatar freighter-avatar--green"><TruckIcon size={28}/><span>{freighter.displayName.slice(0, 2).toUpperCase()}</span></div>{freighter.availableToday ? <span className="availability availability--now">Disponível hoje</span> : <span className="availability">Consulte horários</span>}</div><h3>{freighter.displayName}</h3><span className="freighter-location"><PinIcon size={15}/>{freighter.city.name} — {freighter.city.stateCode}</span><div className="rating"><StarIcon/><strong>{rating ? rating.toFixed(1) : "Novo"}</strong><span>{rating ? `(${freighter.reviews.length} avaliações)` : "no AcheiNoVale"}</span></div><div className="service-tags">{freighter.services.slice(0, 4).map(service => <span key={service.id}>{service.name}</span>)}</div><small className="catalog-code">{freighter.publicCode.toUpperCase()}</small><Link className="outline-button" href={freighterUrl(freighter)}>Ver perfil</Link></article>; })}</div> : <div className="empty-state catalog-empty"><strong>Nenhum freteiro encontrado.</strong><p>Os perfis aprovados aparecerão aqui. Retire os filtros ou divulgue seu serviço.</p><Link className="button button--primary" href="/publicar/frete">Divulgar meus fretes</Link></div>}
  </div></main><MobileNav/></>;
}
