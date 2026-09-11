import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CityTourismVisual } from "@/components/city-tourism-visual";
import { resolveRequestCity } from "@/lib/location/selected-city";
import Form from "next/form";
import { Header } from "@/components/header";
import { MobileNav } from "@/components/mobile-nav";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { SiteFooter } from "@/components/footer";
import { UserAvatar } from "@/components/user-avatar";
import { prisma } from "@/lib/db";
import { freighterUrl, propertyUrl } from "@/lib/listings/urls";
import { propertyImagePublicUrl } from "@/lib/supabase/storage";
import {
  ArrowIcon,
  BathIcon,
  BedIcon,
  BuildingIcon,
  HomeIcon,
  PinIcon,
  SearchIcon,
  ShieldIcon,
  StarIcon,
  TruckIcon,
} from "@/components/icons";

type Props = { searchParams: Promise<{ cidade?: string | string[] }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const requestedSlug = typeof params.cidade === "string" ? params.cidade : undefined;
  const city = await resolveRequestCity(requestedSlug);
  const description = `Encontre imóveis e freteiros em ${city.name} e região.`;
  return {
    title: `Achei no Vale — Imóveis e fretes em ${city.name}`,
    description,
    openGraph: { title: `Achei no Vale em ${city.name}`, description },
  };
}

export default async function HomePage({ searchParams }: Props) {
  const params = await searchParams;
  const requestedSlug = typeof params.cidade === "string" ? params.cidade : undefined;
  const city = await resolveRequestCity(requestedSlug);
  const [properties, freighters] = city.id ? await Promise.all([
    prisma.property.findMany({
      where: { status: "ACTIVE", cityId: city.id },
      include: { city: true, neighborhood: true, images: { orderBy: { position: "asc" }, take: 1 } },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 3,
    }),
    prisma.freighterProfile.findMany({
      where: { status: "ACTIVE", cityId: city.id },
      include: {
        city: true,
        user: { select: { image: true } },
        services: { orderBy: { name: "asc" } },
        reviews: { where: { isVisible: true }, select: { rating: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 3,
    }),
  ]) : [[], []];
  const cityName = city.name;
  const cityQuery = `cidade=${encodeURIComponent(city.slug)}`;
  const propertiesHref = `/imoveis?${cityQuery}`;
  const freightersHref = `/freteiros?${cityQuery}`;
  const rentalsHref = `${propertiesHref}&finalidade=aluguel`;

  return (
    <>
      <Header citySlug={city?.slug} />
      <main>
        <section className="hero">
          <div className="container hero__inner">
            <div className="hero__content">
              <div className="eyebrow"><PinIcon size={16}/> Feito para {cityName} e região</div>
              <h1>O que você procura<br/><em>em {cityName}?</em></h1>
              <p>Imóveis e fretes da nossa região, reunidos em um só lugar. Simples, local e direto pelo WhatsApp.</p>

              <Form className="main-search" action="/buscar">
                {city ? <input type="hidden" name="cidade" value={city.slug} /> : null}
                <SearchIcon size={22}/>
                <input name="q" aria-label="O que você procura?" placeholder="Ex: casa para alugar no Centro" />
                <PendingSubmitButton aria-label="Buscar" pendingText="Buscando..." navigation><SearchIcon size={20}/><span>Buscar</span></PendingSubmitButton>
              </Form>

              <div className="quick-searches" aria-label="Buscas populares">
                <span>Buscas populares:</span>
                <Link href={rentalsHref}>Imóveis para alugar</Link>
                <Link href={freightersHref}>Encontrar freteiro</Link>
              </div>
            </div>

            <CityTourismVisual citySlug={city?.slug} cityName={cityName} />
          </div>

          <div className="container category-wrap">
            <div className="category-grid">
              <Link className="category-card category-card--property" href={propertiesHref}>
                <span className="category-card__icon"><HomeIcon size={31}/></span>
                <span className="category-card__copy"><small>Quero encontrar</small><strong>Um imóvel</strong><span>Casas, apartamentos e terrenos</span></span>
                <span className="category-card__arrow"><ArrowIcon/></span>
              </Link>
              <Link className="category-card category-card--freight" href={freightersHref}>
                <span className="category-card__icon"><TruckIcon size={31}/></span>
                <span className="category-card__copy"><small>Preciso de</small><strong>Um freteiro</strong><span>Mudanças, entregas e transportes</span></span>
                <span className="category-card__arrow"><ArrowIcon/></span>
              </Link>
            </div>
          </div>
        </section>

        <section className="section properties-section">
          <div className="container">
            <div className="section-heading">
              <div><span className="section-kicker">Novidades por perto</span><h2>Imóveis recentes</h2><p>Boas oportunidades publicadas em {cityName}.</p></div>
              <Link className="text-link" href={propertiesHref}>Ver todos <ArrowIcon/></Link>
            </div>
            <div className="property-grid">
              {properties.map((property) => (
                <article className="property-card" key={property.id}>
                  <div className="property-card__image">
                    <Link href={propertyUrl(property)} aria-label={`Ver ${property.title}`}>
                      {property.images[0] ? <Image src={propertyImagePublicUrl(property.images[0].storageKey)} alt={property.images[0].altText || property.title} fill sizes="(max-width: 680px) 88vw, 33vw" /> : <span className="catalog-image-placeholder"><HomeIcon size={42}/><span>Ver imóvel</span></span>}
                    </Link>
                    <span className="property-card__tag">{property.purpose === "RENT" ? "Aluguel" : "Venda"}</span>
                  </div>
                  <div className="property-card__body">
                    <span className="property-card__location"><PinIcon size={15}/>{property.neighborhood.name}, {property.city.name}</span>
                    <h3><Link href={propertyUrl(property)}>{property.title}</Link></h3>
                    <div className="property-card__features">
                      {property.bedrooms !== null ? <span><BedIcon/>{property.bedrooms} quartos</span> : null}
                      {property.bathrooms !== null ? <span><BathIcon/>{property.bathrooms} banh.</span> : null}
                      {property.areaM2 ? <span>{property.areaM2.toString()} m²</span> : null}
                    </div>
                    <div className="property-card__price"><strong>{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(property.priceCents / 100)}</strong><span>{property.purpose === "RENT" ? "/mês" : ""}</span></div>
                    <Link className="button button--secondary property-card__cta" href={propertyUrl(property)}>Ver imóvel</Link>
                  </div>
                </article>
              ))}
            </div>
            {!properties.length ? <div className="empty-state home-empty"><strong>Ainda não há imóveis em {cityName}.</strong><p>Seja a primeira pessoa a publicar uma oportunidade nesta cidade.</p><Link className="button button--primary" href="/publicar/imovel">Publicar imóvel</Link></div> : null}
            <Link className="mobile-more-button" href={propertiesHref}>Ver todos os imóveis <ArrowIcon/></Link>
          </div>
        </section>

        <section className="section freighters-section">
          <div className="container">
            <div className="section-heading">
              <div><span className="section-kicker section-kicker--orange">Quem resolve por aqui</span><h2>Freteiros em destaque</h2><p>Profissionais avaliados que atendem {cityName} e região.</p></div>
              <Link className="text-link" href={freightersHref}>Ver todos <ArrowIcon/></Link>
            </div>
            <div className="freighter-grid">
              {freighters.map((freighter) => (
                <article className="freighter-card" key={freighter.id}>
                  <div className="freighter-card__top"><UserAvatar image={freighter.user.image} name={freighter.displayName} size="lg" /></div>
                  <h3>{freighter.displayName}</h3>
                  <span className="freighter-location"><PinIcon size={15}/>{freighter.city.name}</span>
                  {(() => { const rating = freighter.reviews.length ? freighter.reviews.reduce((sum, review) => sum + review.rating, 0) / freighter.reviews.length : null; return <div className="rating"><StarIcon/><strong>{rating ? rating.toFixed(1) : "Novo"}</strong><span>{rating ? `(${freighter.reviews.length} avaliações)` : "no AcheiNoVale"}</span></div>; })()}
                  <div className="service-tags">{freighter.services.filter(service => !service.name.startsWith("Atende: ")).slice(0, 4).map((service) => <span key={service.id}>{service.name.replace("Veículo: ", "")}</span>)}</div>
                  <Link className="outline-button" href={freighterUrl(freighter)}>Ver perfil <ArrowIcon/></Link>
                </article>
              ))}
            </div>
            {!freighters.length ? <div className="empty-state home-empty"><strong>Ainda não há freteiros cadastrados em {cityName}.</strong><p>Cadastre seu serviço para começar a receber contatos da região.</p><Link className="button button--primary" href="/publicar/frete">Cadastrar como freteiro</Link></div> : null}
            <Link className="mobile-more-button" href={freightersHref}>Encontrar um freteiro <ArrowIcon/></Link>
          </div>
        </section>

        <section className="container trust-strip">
          <div className="trust-strip__icon"><ShieldIcon size={28}/></div>
          <div><strong>Mais confiança para negociar perto de casa</strong><span>Perfis, avaliações e denúncias ajudam a comunidade a fazer escolhas melhores.</span></div>
          <Link href="/seguranca">Dicas de segurança <ArrowIcon/></Link>
        </section>

        <section className="container publish-banner">
          <div className="publish-banner__art" aria-hidden="true"><BuildingIcon size={52}/><TruckIcon size={59}/></div>
          <div><span className="section-kicker section-kicker--light">Tem algo para anunciar?</span><h2>Encontre gente da região interessada.</h2><p>Publique seu imóvel ou apresente seu serviço de frete. É simples e gratuito.</p></div>
          <Link className="button button--light" href="/publicar">Publicar grátis <ArrowIcon/></Link>
        </section>
      </main>

      <SiteFooter />
      <MobileNav citySlug={city?.slug} />
    </>
  );
}
