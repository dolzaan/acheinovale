import Link from "next/link";
import { CityTourismVisual } from "@/components/city-tourism-visual";
import { prisma } from "@/lib/db";
import Form from "next/form";
import { freighters, properties } from "@/data/home";
import { Header } from "@/components/header";
import { MobileNav } from "@/components/mobile-nav";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { SiteFooter } from "@/components/footer";
import {
  ArrowIcon,
  BathIcon,
  BedIcon,
  BuildingIcon,
  HeartIcon,
  HomeIcon,
  PinIcon,
  SearchIcon,
  ShieldIcon,
  StarIcon,
  TruckIcon,
} from "@/components/icons";

type Props = { searchParams: Promise<{ cidade?: string | string[] }> };

export default async function HomePage({ searchParams }: Props) {
  const params = await searchParams;
  const requestedSlug = typeof params.cidade === "string" ? params.cidade : undefined;
  const city = requestedSlug
    ? await prisma.city.findFirst({
        where: { slug: requestedSlug, isActive: true },
        select: { name: true, slug: true },
      })
    : { name: "Rio do Sul", slug: "rio-do-sul" };
  const cityName = city?.name ?? "sua cidade";
  const cityQuery = city ? `cidade=${encodeURIComponent(city.slug)}` : "";
  const propertiesHref = cityQuery ? `/imoveis?${cityQuery}` : "/imoveis";
  const rentalsHref = `${propertiesHref}${cityQuery ? "&" : "?"}finalidade=aluguel`;

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
                <Link href="/freteiros?disponivel=hoje">Frete hoje</Link>
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
              <Link className="category-card category-card--freight" href="/freteiros">
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
              <div><span className="section-kicker">Novidades por perto</span><h2>Imóveis recentes</h2><p>Boas oportunidades publicadas em Rio do Sul.</p></div>
              <Link className="text-link" href={propertiesHref}>Ver todos <ArrowIcon/></Link>
            </div>
            <div className="property-grid">
              {properties.map((property) => (
                <article className="property-card" key={property.id}>
                  <div className="property-card__image">
                    <Link href={propertiesHref} aria-label="Ver imóveis disponíveis">
                      {/* A URL é de uma fonte de demonstração e será substituída por Supabase Storage. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={property.image} alt={property.title}/>
                    </Link>
                    <span className="property-card__tag">{property.tag}</span>
                    <button className="favorite-button" type="button" aria-label={`Favoritar ${property.title}`}><HeartIcon/></button>
                  </div>
                  <div className="property-card__body">
                    <span className="property-card__location"><PinIcon size={15}/>{property.location}</span>
                    <h3><Link href={propertiesHref}>{property.title}</Link></h3>
                    <div className="property-card__features">
                      <span><BedIcon/>{property.beds} quartos</span><span><BathIcon/>{property.baths} banh.</span><span>{property.area}</span>
                    </div>
                    <div className="property-card__price"><strong>{property.price}</strong><span>{property.suffix}</span></div>
                    <Link className="button button--secondary property-card__cta" href={propertiesHref}>Explorar imóveis</Link>
                  </div>
                </article>
              ))}
            </div>
            <Link className="mobile-more-button" href={propertiesHref}>Ver todos os imóveis <ArrowIcon/></Link>
          </div>
        </section>

        <section className="section freighters-section">
          <div className="container">
            <div className="section-heading">
              <div><span className="section-kicker section-kicker--orange">Quem resolve por aqui</span><h2>Freteiros em destaque</h2><p>Profissionais avaliados que atendem Rio do Sul e região.</p></div>
              <Link className="text-link" href="/freteiros">Ver todos <ArrowIcon/></Link>
            </div>
            <div className="freighter-grid">
              {freighters.map((freighter) => (
                <article className="freighter-card" key={freighter.id}>
                  <div className="freighter-card__top">
                    <div className={`freighter-avatar freighter-avatar--${freighter.tone}`}><TruckIcon size={28}/><span>{freighter.initials}</span></div>
                    <span className={`availability ${freighter.availability.includes("hoje") ? "availability--now" : ""}`}>{freighter.availability}</span>
                  </div>
                  <h3>{freighter.name}</h3>
                  <span className="freighter-location"><PinIcon size={15}/>{freighter.location}</span>
                  <div className="rating"><StarIcon/><strong>{freighter.rating}</strong><span>({freighter.reviews} avaliações)</span></div>
                  <div className="service-tags">{freighter.services.map((service) => <span key={service}>{service}</span>)}</div>
                  <Link className="outline-button" href="/freteiros">Ver profissionais <ArrowIcon/></Link>
                </article>
              ))}
            </div>
            <Link className="mobile-more-button" href="/freteiros">Encontrar um freteiro <ArrowIcon/></Link>
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
      <MobileNav />
    </>
  );
}
