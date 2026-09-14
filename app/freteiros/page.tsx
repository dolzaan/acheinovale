import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Form from "next/form";
import { Header } from "@/components/header";
import { MobileNav } from "@/components/mobile-nav";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { PinIcon, SearchIcon, StarIcon } from "@/components/icons";
import { prisma } from "@/lib/db";
import { resolveRequestCity } from "@/lib/location/selected-city";
import { freighterUrl } from "@/lib/listings/urls";
import { UserAvatar } from "@/components/user-avatar";
import { freighterImagePublicUrl } from "@/lib/supabase/storage";

type Props = { searchParams: Promise<{ q?: string; cidade?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const city = await resolveRequestCity(params.cidade);
  const description = `Fretes, mudanças, entregas e transportes em ${city.name} e região.`;
  return {
    title: `Freteiros em ${city.name} | AcheiNoVale`,
    description,
    alternates: { canonical: "https://acheinovale.vercel.app/freteiros" },
    openGraph: { title: `Freteiros em ${city.name} | AcheiNoVale`, description },
  };
}

export default async function FreightersPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = params.q?.trim().slice(0, 80) || "";
  const selectedCity = await resolveRequestCity(params.cidade);
  const cityMatch = selectedCity ? { OR: [{ cityId: selectedCity.id }, { services: { some: { slug: `atende-${selectedCity.slug}` } } }] } : {};
  const foundFreighters = await prisma.freighterProfile.findMany({
    where: { status: "ACTIVE", AND: [cityMatch, ...(query ? [{ OR: [{ displayName: { contains: query, mode: "insensitive" as const } }, { description: { contains: query, mode: "insensitive" as const } }, { services: { some: { name: { contains: query, mode: "insensitive" as const } } } }] }] : [])] },
    include: { city: true, user: { select: { image: true } }, images: { orderBy: { position: "asc" }, take: 1 }, services: { orderBy: { name: "asc" } }, reviews: { where: { isVisible: true }, select: { rating: true } } }, orderBy: { updatedAt: "desc" }, take: 100,
  });
  const freighters = foundFreighters.toSorted((a, b) => {
    const score = (profile: typeof a) => (profile.images.length ? 4 : 0) + (profile.user.image ? 1 : 0) + (profile.description.length >= 80 ? 1 : 0) + (profile.priceNote ? 1 : 0) + (profile.services.some(service => service.name.startsWith("Veículo: ")) ? 1 : 0) + (profile.services.some(service => service.name.startsWith("Atende: ")) ? 1 : 0);
    return score(b) - score(a) || b.updatedAt.getTime() - a.updatedAt.getTime();
  }).slice(0, 48);
  const cityName = selectedCity?.name ?? "sua cidade";
  return <><Header citySlug={selectedCity?.slug}/><main className="catalog-page"><div className="container catalog-container">
    <div className="catalog-heading"><div><span className="section-kicker section-kicker--orange">Profissionais de {cityName}</span><h1>Freteiros</h1><p>Encontre ajuda para mudanças, entregas e transportes em {cityName} e região.</p></div><Link className="button button--primary" href="/publicar/frete">Cadastrar como freteiro</Link></div>
    <Form className="catalog-filter catalog-filter--freighters" action="/freteiros">{selectedCity ? <input type="hidden" name="cidade" value={selectedCity.slug}/> : null}<label className="catalog-filter__search"><SearchIcon size={19}/><input name="q" defaultValue={query} placeholder="Ex: mudança, entrega ou bairro" aria-label="Buscar freteiros"/></label><PendingSubmitButton className="button button--primary" pendingText="Buscando..." navigation>Buscar</PendingSubmitButton></Form>
    {freighters.length ? <div className="freighter-grid catalog-grid">{freighters.map(freighter => { const rating = freighter.reviews.length ? freighter.reviews.reduce((sum, review) => sum + review.rating, 0) / freighter.reviews.length : null; const cover = freighter.images[0]; return <article className={`freighter-card${cover ? " freighter-card--with-photo" : ""}`} key={freighter.id}>{cover ? <Link className="freighter-card__cover" href={freighterUrl(freighter)} aria-label={`Ver perfil de ${freighter.displayName}`}><Image src={freighterImagePublicUrl(cover.storageKey)} alt={cover.altText || `Serviço de ${freighter.displayName}`} fill sizes="(max-width: 680px) 82vw, 350px"/><span className="freighter-profile-badge">Perfil com fotos</span></Link> : null}<div className="freighter-card__body"><div className="freighter-card__top"><UserAvatar image={freighter.user.image} name={freighter.displayName} size={cover ? "sm" : "lg"} />{cover ? <span className="freighter-profile-badge">Perfil completo</span> : null}</div><h3>{freighter.displayName}</h3><span className="freighter-location"><PinIcon size={15}/>{freighter.city.name}</span><div className="rating"><StarIcon/><strong>{rating ? rating.toFixed(1) : "Novo"}</strong><span>{rating ? `(${freighter.reviews.length} avaliações)` : "no AcheiNoVale"}</span></div><div className="service-tags">{freighter.services.filter(service => !service.name.startsWith("Atende: ")).slice(0, 4).map(service => <span key={service.id}>{service.name.replace("Veículo: ", "")}</span>)}</div><small className="catalog-code">{freighter.publicCode.toUpperCase()}</small><Link className="outline-button" href={freighterUrl(freighter)}>Ver perfil</Link></div></article>; })}</div> : <div className="empty-state catalog-empty"><strong>Nenhum freteiro em {cityName}.</strong><p>{query ? "Tente buscar por outro serviço." : "Seja o primeiro profissional da cidade a criar um cadastro."}</p><Link className="button button--primary" href="/publicar/frete">Cadastrar como freteiro</Link></div>}
  </div></main><MobileNav citySlug={selectedCity?.slug}/></>;
}
