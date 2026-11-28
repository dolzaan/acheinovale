import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CityDiscovery } from "@/components/city-discovery";
import { AutoDetectCity } from "@/components/auto-detect-city";
import { CityTourismVisual } from "@/components/city-tourism-visual";
import { resolveRequestCity } from "@/lib/location/selected-city";
import Form from "next/form";
import { Header } from "@/components/header";
import { MobileNav } from "@/components/mobile-nav";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { SiteFooter } from "@/components/footer";
import { UserAvatar } from "@/components/user-avatar";
import { Objeto3D } from "@/components/objeto-3d";
import { getHomeListings } from "@/lib/listings/public-cache";
import { freighterUrl, propertyCatalogPath, propertyUrl } from "@/lib/listings/urls";
import { propertyImagePublicUrl } from "@/lib/supabase/storage";
import { SITE_URL } from "@/lib/site";
import {
  AreaIcon,
  ArrowIcon,
  BathIcon,
  BedIcon,
  HomeIcon,
  PinIcon,
  SearchIcon,
  ShieldIcon,
  StarIcon,
} from "@/components/icons";
import { formatArea, formatCount, formatRating } from "@/lib/format";

type Props = { searchParams: Promise<{ cidade?: string | string[] }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const requestedSlug = typeof params.cidade === "string" ? params.cidade : undefined;
  const city = await resolveRequestCity(requestedSlug);
  const description = `Encontre imóveis e freteiros em ${city.name} e região.`;
  return {
    title: `Achei no Vale — Imóveis e fretes em ${city.name}`,
    description,
    alternates: { canonical: SITE_URL },
    openGraph: { title: `Achei no Vale em ${city.name}`, description, url: SITE_URL },
  };
}

export default async function HomePage({ searchParams }: Props) {
  const params = await searchParams;
  const requestedSlug = typeof params.cidade === "string" ? params.cidade : undefined;
  const city = await resolveRequestCity(requestedSlug);
  const [properties, freighters] = city.id ? await getHomeListings(city.id) : [[], []];
  const cityName = city.name;
  const propertiesHref = `/${city.slug}/imoveis`;
  const freightersHref = `/${city.slug}/freteiros`;
  const rentalsHref = propertyCatalogPath(city.slug, "aluguel");
  const salesHref = propertyCatalogPath(city.slug, "venda");
  // Cidade sem nenhum anúncio: um bloco só de lançamento em vez de duas seções vazias.
  const cityIsEmpty = !properties.length && !freighters.length;

  return (
    <>
      <AutoDetectCity />
      <Header citySlug={city?.slug} />
      <main id="conteudo">
        <section className="hero">
          <div className="container hero__inner">
            <div className="hero__content">
              <div className="eyebrow"><PinIcon size={16}/> Feito para {cityName} e região</div>
              <h1>O que você procura<br/><em>em {cityName}?</em></h1>
              <p>Imóveis e fretes da nossa região, reunidos em um só lugar. Simples, local e direto pelo WhatsApp.</p>

              <Form id="home-search-form" className="main-search" action="/buscar">
                {city ? <input type="hidden" name="cidade" value={city.slug} /> : null}
                <SearchIcon size={22}/>
                <input type="search" name="q" autoComplete="off" aria-label="O que você procura?" placeholder="Ex: casa para alugar no Centro…" />
                <PendingSubmitButton aria-label="Buscar" pendingText="Buscando…" navigation><SearchIcon size={20}/><span>Buscar</span></PendingSubmitButton>
              </Form>

              <nav className="quick-searches" aria-label="Atalhos de busca">
                <Link prefetch={false} href={rentalsHref}>Imóveis para alugar</Link>
                <Link prefetch={false} href={salesHref}>Imóveis à venda</Link>
                <Link prefetch={false} href={freightersHref}>Encontrar freteiro</Link>
                <Link prefetch={false} href="/imoveis?regiao=1">Imóveis em toda a região</Link>
              </nav>
            </div>

            <CityTourismVisual citySlug={city?.slug} cityName={cityName} />
          </div>

          <div className="container category-wrap">
            <div className="category-grid">
              <Link prefetch={false} className="category-card category-card--property" href={propertiesHref}>
                <span className="category-card__icon category-card__icon--3d"><Objeto3D nome="casa" tamanho={72} prioridade/></span>
                <span className="category-card__copy"><small>Quero encontrar</small><strong>Um imóvel</strong><span>Casas, apartamentos e terrenos</span></span>
                <span className="category-card__arrow"><ArrowIcon/></span>
              </Link>
              <Link prefetch={false} className="category-card category-card--freight" href={freightersHref}>
                <span className="category-card__icon category-card__icon--3d"><Objeto3D nome="caminhao" tamanho={72} prioridade/></span>
                <span className="category-card__copy"><small>Preciso de</small><strong>Um freteiro</strong><span>Mudanças, entregas e transportes</span></span>
                <span className="category-card__arrow"><ArrowIcon/></span>
              </Link>
            </div>
          </div>
        </section>

        {cityIsEmpty ? (
          <section className="section launch-section" aria-labelledby="launch-title">
            <div className="container">
              <h2 id="launch-title">O Achei no Vale está chegando em {cityName}</h2>
              <p>Os primeiros anúncios da cidade vão aparecer aqui. Enquanto isso:</p>
              <div className="launch-options">
                <div>
                  <h3>Procura um imóvel?</h3>
                  <p>Deixe um alerta e avisamos por e-mail quando aparecer um imóvel em {cityName}.</p>
                  <Link prefetch={false} className="button button--primary" href={propertiesHref}>Criar alerta de imóveis</Link>
                </div>
                <div>
                  <h3>Tem algo para anunciar?</h3>
                  <p>Imóvel para alugar ou vender, ou seu serviço de frete. É grátis.</p>
                  <Link prefetch={false} className="button button--secondary" href="/publicar">Anunciar grátis</Link>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <>
        <section className="section properties-section">
          <div className="container">
            <div className="section-heading">
              <div><h2>Imóveis recentes</h2><p>Anunciados em {cityName}.</p></div>
              <Link prefetch={false} className="text-link" href={propertiesHref}>Ver todos <ArrowIcon/></Link>
            </div>
            <div className="property-grid">
              {properties.map((property) => (
                <article className="property-card" key={property.id}>
                  <div className="property-card__image">
                    <Link prefetch={false} href={propertyUrl(property)} aria-label={`Ver ${property.title}`}>
                      {property.images[0] ? <Image src={propertyImagePublicUrl(property.images[0].storageKey)} alt={property.images[0].altText || property.title} fill sizes="(max-width: 680px) 88vw, 33vw" /> : <span className="catalog-image-placeholder"><HomeIcon size={42}/><span>Ver imóvel</span></span>}
                    </Link>
                    <span className="property-card__tag">{property.purpose === "RENT" ? "Aluguel" : "Venda"}</span>
                  </div>
                  <div className="property-card__body">
                    <span className="property-card__location"><PinIcon size={15}/>{property.neighborhood.name}, {property.city.name}</span>
                    <h3><Link prefetch={false} href={propertyUrl(property)}>{property.title}</Link></h3>
                    <div className="property-card__features">
                      {property.bedrooms !== null ? <span><BedIcon/>{formatCount(property.bedrooms, "quarto", "quartos")}</span> : null}
                      {property.bathrooms !== null ? <span><BathIcon/>{property.bathrooms} banh.</span> : null}
                      {property.areaM2 ? <span><AreaIcon/>{formatArea(property.areaM2)}</span> : null}
                    </div>
                    <div className="property-card__price"><strong>{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(property.priceCents / 100)}</strong><span>{property.purpose === "RENT" ? "/mês" : ""}</span></div>
                    <Link prefetch={false} className="button button--secondary property-card__cta" href={propertyUrl(property)}>Ver imóvel</Link>
                  </div>
                </article>
              ))}
            </div>
            {!properties.length ? <p className="home-empty-note home-empty-note--3d"><Objeto3D nome="lupa" tamanho={52}/><span>Ainda não há imóveis anunciados em {cityName}. <Link prefetch={false} href={propertiesHref}>Criar um alerta</Link> para saber quando aparecer.</span></p> : null}
            <Link prefetch={false} className="mobile-more-button" href={propertiesHref}>Ver todos os imóveis <ArrowIcon/></Link>
          </div>
        </section>

          <section className="section freighters-section">
          <div className="container">
            <div className="section-heading">
              <div><h2>Freteiros em destaque</h2><p>Profissionais que atendem {cityName} e região.</p></div>
              <Link prefetch={false} className="text-link" href={freightersHref}>Ver todos <ArrowIcon/></Link>
            </div>
            <div className="freighter-grid">
              {freighters.map((freighter) => (
                <article className="freighter-card" key={freighter.id}>
                  <div className="freighter-card__top"><UserAvatar image={freighter.user.image} name={freighter.displayName} size="lg" /></div>
                  <h3>{freighter.displayName}</h3>
                  <span className="freighter-location"><PinIcon size={15}/>{freighter.city.name}</span>
                  {(() => { const rating = freighter.reviews.length ? freighter.reviews.reduce((sum, review) => sum + review.rating, 0) / freighter.reviews.length : null; return <div className="rating"><StarIcon/><strong>{rating ? formatRating(rating) : "Novo"}</strong><span>{rating ? `(${formatCount(freighter.reviews.length, "avaliação", "avaliações")})` : "no AcheiNoVale"}</span></div>; })()}
                  <div className="service-tags">{freighter.services.filter(service => !service.name.startsWith("Atende: ")).slice(0, 4).map((service) => <span key={service.id}>{service.name.replace("Veículo: ", "")}</span>)}</div>
                  <Link prefetch={false} className="outline-button" href={freighterUrl(freighter)}>Ver perfil <ArrowIcon/></Link>
                </article>
              ))}
            </div>
            {!freighters.length ? <p className="home-empty-note home-empty-note--3d"><Objeto3D nome="caixa" tamanho={52}/><span>Ainda não há freteiros anunciados em {cityName}. Faz fretes? <Link prefetch={false} href="/publicar/frete">Anuncie seu serviço de graça</Link>.</span></p> : null}
            <Link prefetch={false} className="mobile-more-button" href={freightersHref}>Encontrar um freteiro <ArrowIcon/></Link>
          </div>
        </section>
          </>
        )}

        <CityDiscovery category="imoveis" currentSlug={city.slug} />
        <section className="container trust-strip">
          <div className="trust-strip__icon"><ShieldIcon size={28}/></div>
          <div><strong>Mais confiança para negociar perto de casa</strong><span>Perfis, avaliações e denúncias ajudam a comunidade a fazer escolhas melhores.</span></div>
          <Link prefetch={false} href="/seguranca">Dicas de segurança <ArrowIcon/></Link>
        </section>

        {/* Com a cidade vazia, o bloco de lançamento já faz este convite. */}
        {!cityIsEmpty ? <section className="container publish-banner">
          <div className="publish-banner__art publish-banner__art--3d" aria-hidden="true"><Objeto3D nome="casa" tamanho={96} flutuar/><Objeto3D nome="chave" tamanho={96} flutuar/><Objeto3D nome="caminhao" tamanho={96} flutuar/></div>
          <div><h2>Tem algo para anunciar?</h2><p>Anuncie seu imóvel ou serviço de frete para gente da região. É grátis.</p></div>
          <Link prefetch={false} className="button button--light" href="/publicar">Anunciar grátis</Link>
        </section> : null}
      </main>

      <SiteFooter />
      <MobileNav citySlug={city?.slug} />
    </>
  );
}
