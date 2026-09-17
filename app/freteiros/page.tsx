import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Form from "next/form";
import { Header } from "@/components/header";
import { MobileNav } from "@/components/mobile-nav";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { PinIcon, SearchIcon, StarIcon } from "@/components/icons";
import { resolveRequestCity } from "@/lib/location/selected-city";
import { getPublicFreighters } from "@/lib/listings/public-cache";
import { freighterUrl } from "@/lib/listings/urls";
import { UserAvatar } from "@/components/user-avatar";
import { freighterImagePublicUrl } from "@/lib/supabase/storage";
import { SITE_URL } from "@/lib/site";

type Props = { searchParams: Promise<{ q?: string; cidade?: string; pagina?: string }> };

const FREIGHTER_PAGE_SIZE = 24;

function parsePage(value?: string) {
  const parsed = Number.parseInt(value || "1", 10);
  return Number.isInteger(parsed) && parsed > 0 && parsed <= 1_000 ? parsed : 1;
}

function freighterPageHref(citySlug: string, query: string, page: number) {
  const params = new URLSearchParams({ cidade: citySlug });
  if (query) params.set("q", query);
  if (page > 1) params.set("pagina", String(page));
  return `/freteiros?${params.toString()}`;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const city = await resolveRequestCity(params.cidade);
  const description = `Fretes, mudanças, entregas e transportes em ${city.name} e região.`;
  return {
    title: `Freteiros em ${city.name} | AcheiNoVale`,
    description,
    alternates: { canonical: `${SITE_URL}/freteiros` },
    openGraph: { title: `Freteiros em ${city.name} | AcheiNoVale`, description },
  };
}

export default async function FreightersPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = params.q?.trim().slice(0, 80) || "";
  const requestedPage = parsePage(params.pagina);
  const selectedCity = await resolveRequestCity(params.cidade);
  const foundFreightersWithNext = selectedCity.id
    ? await getPublicFreighters(
      selectedCity.id,
      selectedCity.slug,
      query,
      (requestedPage - 1) * FREIGHTER_PAGE_SIZE,
      FREIGHTER_PAGE_SIZE + 1,
    )
    : [];
  const hasNextPage = foundFreightersWithNext.length > FREIGHTER_PAGE_SIZE;
  const foundFreighters = foundFreightersWithNext.slice(0, FREIGHTER_PAGE_SIZE);
  const freighters = foundFreighters.toSorted((a, b) => {
    const score = (profile: typeof a) => (profile.images.length ? 4 : 0) + (profile.user.image ? 1 : 0) + (profile.description.length >= 80 ? 1 : 0) + (profile.priceNote ? 1 : 0) + (profile.services.some(service => service.name.startsWith("Veículo: ")) ? 1 : 0) + (profile.services.some(service => service.name.startsWith("Atende: ")) ? 1 : 0);
    return score(b) - score(a) || b.updatedAtMs - a.updatedAtMs;
  });
  const cityName = selectedCity?.name ?? "sua cidade";
  return <><Header citySlug={selectedCity?.slug}/><main className="catalog-page"><div className="container catalog-container">
    <div className="catalog-heading"><div><span className="section-kicker section-kicker--orange">Profissionais de {cityName}</span><h1>Freteiros</h1><p>Encontre ajuda para mudanças, entregas e transportes em {cityName} e região.</p></div><Link prefetch={false} className="button button--primary" href="/publicar/frete">Cadastrar como freteiro</Link></div>
    <Form className="catalog-filter catalog-filter--freighters" action="/freteiros">{selectedCity ? <input type="hidden" name="cidade" value={selectedCity.slug}/> : null}<label className="catalog-filter__search"><SearchIcon size={19}/><input name="q" defaultValue={query} placeholder="Ex: mudança, entrega ou bairro" aria-label="Buscar freteiros"/></label><PendingSubmitButton className="button button--primary" pendingText="Buscando..." navigation>Buscar</PendingSubmitButton></Form>
    {freighters.length ? <div className="freighter-grid catalog-grid">{freighters.map(freighter => { const rating = freighter.reviews.length ? freighter.reviews.reduce((sum, review) => sum + review.rating, 0) / freighter.reviews.length : null; const cover = freighter.images[0]; return <article className={`freighter-card${cover ? " freighter-card--with-photo" : ""}`} key={freighter.id}>{cover ? <Link prefetch={false} className="freighter-card__cover" href={freighterUrl(freighter)} aria-label={`Ver perfil de ${freighter.displayName}`}><Image src={freighterImagePublicUrl(cover.storageKey)} alt={cover.altText || `Serviço de ${freighter.displayName}`} fill sizes="(max-width: 680px) 82vw, 350px"/><span className="freighter-profile-badge">Perfil com fotos</span></Link> : null}<div className="freighter-card__body"><div className="freighter-card__top"><UserAvatar image={freighter.user.image} name={freighter.displayName} size={cover ? "sm" : "lg"} />{cover ? <span className="freighter-profile-badge">Perfil completo</span> : null}</div><h3>{freighter.displayName}</h3><span className="freighter-location"><PinIcon size={15}/>{freighter.city.name}</span><div className="rating"><StarIcon/><strong>{rating ? rating.toFixed(1) : "Novo"}</strong><span>{rating ? `(${freighter.reviews.length} avaliações)` : "no AcheiNoVale"}</span></div><div className="service-tags">{freighter.services.filter(service => !service.name.startsWith("Atende: ")).slice(0, 4).map(service => <span key={service.id}>{service.name.replace("Veículo: ", "")}</span>)}</div><small className="catalog-code">{freighter.publicCode.toUpperCase()}</small><Link prefetch={false} className="outline-button" href={freighterUrl(freighter)}>Ver perfil</Link></div></article>; })}</div> : <div className="empty-state catalog-empty"><strong>Nenhum freteiro em {cityName}.</strong><p>{query ? "Tente buscar por outro serviço." : "Seja o primeiro profissional da cidade a criar um cadastro."}</p><Link prefetch={false} className="button button--primary" href="/publicar/frete">Cadastrar como freteiro</Link></div>}
    {(requestedPage > 1 || hasNextPage) ? <nav className="catalog-pagination" aria-label="Paginação de freteiros">
      {requestedPage > 1 ? <Link prefetch={false} href={freighterPageHref(selectedCity.slug, query, requestedPage - 1)}>← Anterior</Link> : <span aria-disabled="true">← Anterior</span>}
      <strong>Página {requestedPage}</strong>
      {hasNextPage ? <Link prefetch={false} href={freighterPageHref(selectedCity.slug, query, requestedPage + 1)}>Próxima →</Link> : <span aria-disabled="true">Próxima →</span>}
    </nav> : null}
  </div></main><MobileNav citySlug={selectedCity?.slug}/></>;
}
