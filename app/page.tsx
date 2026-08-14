import Link from "next/link";
import { freighters, properties } from "@/data/home";
import { Header } from "@/components/header";
import { MobileNav } from "@/components/mobile-nav";
import { Logo } from "@/components/logo";
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

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <section className="hero">
          <div className="container hero__inner">
            <div className="hero__content">
              <div className="eyebrow"><PinIcon size={16}/> Feito para Rio do Sul e região</div>
              <h1>O que você procura<br/><em>em Rio do Sul?</em></h1>
              <p>Imóveis e fretes da nossa região, reunidos em um só lugar. Simples, local e direto pelo WhatsApp.</p>

              <form className="main-search" action="/buscar">
                <SearchIcon size={22}/>
                <input name="q" aria-label="O que você procura?" placeholder="Ex: casa para alugar no Centro" />
                <button type="submit" aria-label="Buscar"><SearchIcon size={20}/><span>Buscar</span></button>
              </form>

              <div className="quick-searches" aria-label="Buscas populares">
                <span>Buscas populares:</span>
                <Link href="/rio-do-sul/imoveis/aluguel">Aluguel até R$ 1.500</Link>
                <Link href="/rio-do-sul/freteiros?disponivel=hoje">Frete hoje</Link>
              </div>
            </div>

            <div className="hero__visual" aria-hidden="true">
              <div className="valley-card">
                <div className="valley-card__sky"><span className="sun"/></div>
                <div className="mountain mountain--back"/>
                <div className="mountain mountain--front"/>
                <div className="road"/>
                <div className="mini-house mini-house--one"><i/></div>
                <div className="mini-house mini-house--two"><i/></div>
                <div className="mini-truck"><i/><b/><b/></div>
                <div className="visual-pin visual-pin--home"><HomeIcon size={18}/></div>
                <div className="visual-pin visual-pin--truck"><TruckIcon size={18}/></div>
              </div>
              <div className="local-proof"><span>✓</span><div><strong>100% local</strong><small>Anúncios de Rio do Sul</small></div></div>
            </div>
          </div>

          <div className="container category-wrap">
            <div className="category-grid">
              <Link className="category-card category-card--property" href="/rio-do-sul/imoveis">
                <span className="category-card__icon"><HomeIcon size={31}/></span>
                <span className="category-card__copy"><small>Quero encontrar</small><strong>Um imóvel</strong><span>Casas, apartamentos e terrenos</span></span>
                <span className="category-card__arrow"><ArrowIcon/></span>
              </Link>
              <Link className="category-card category-card--freight" href="/rio-do-sul/freteiros">
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
              <Link className="text-link" href="/rio-do-sul/imoveis">Ver todos <ArrowIcon/></Link>
            </div>
            <div className="property-grid">
              {properties.map((property) => (
                <article className="property-card" key={property.id}>
                  <div className="property-card__image">
                    <Link href={`/imovel/${property.id}`} aria-label={`Ver ${property.title}`}>
                      {/* A URL é de uma fonte de demonstração e será substituída por Supabase Storage. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={property.image} alt={property.title}/>
                    </Link>
                    <span className="property-card__tag">{property.tag}</span>
                    <button className="favorite-button" type="button" aria-label={`Favoritar ${property.title}`}><HeartIcon/></button>
                  </div>
                  <div className="property-card__body">
                    <span className="property-card__location"><PinIcon size={15}/>{property.location}</span>
                    <h3><Link href={`/imovel/${property.id}`}>{property.title}</Link></h3>
                    <div className="property-card__features">
                      <span><BedIcon/>{property.beds} quartos</span><span><BathIcon/>{property.baths} banh.</span><span>{property.area}</span>
                    </div>
                    <div className="property-card__price"><strong>{property.price}</strong><span>{property.suffix}</span></div>
                  </div>
                </article>
              ))}
            </div>
            <Link className="mobile-more-button" href="/rio-do-sul/imoveis">Ver todos os imóveis <ArrowIcon/></Link>
          </div>
        </section>

        <section className="section freighters-section">
          <div className="container">
            <div className="section-heading">
              <div><span className="section-kicker section-kicker--orange">Quem resolve por aqui</span><h2>Freteiros em destaque</h2><p>Profissionais avaliados que atendem Rio do Sul e região.</p></div>
              <Link className="text-link" href="/rio-do-sul/freteiros">Ver todos <ArrowIcon/></Link>
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
                  <Link className="outline-button" href={`/freteiro/${freighter.id}`}>Ver perfil <ArrowIcon/></Link>
                </article>
              ))}
            </div>
            <Link className="mobile-more-button" href="/rio-do-sul/freteiros">Encontrar um freteiro <ArrowIcon/></Link>
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

      <footer className="site-footer">
        <div className="container footer-grid">
          <div><Logo light/><p>Encontre perto. Resolva no Vale.<br/>Feito no Alto Vale.</p></div>
          <div><strong>Explorar</strong><Link href="/rio-do-sul/imoveis">Imóveis</Link><Link href="/rio-do-sul/freteiros">Freteiros</Link><Link href="/publicar">Publicar anúncio</Link></div>
          <div><strong>Ajuda</strong><Link href="/seguranca">Segurança</Link><Link href="/ajuda">Central de ajuda</Link><Link href="/contato">Fale conosco</Link></div>
          <div className="footer-local"><PinIcon/><span>Começando por</span><strong>Rio do Sul — SC</strong></div>
        </div>
        <div className="container footer-bottom"><span>© 2026 AcheiNoVale</span><span>Feito com carinho no Alto Vale de Santa Catarina.</span></div>
      </footer>
      <MobileNav />
    </>
  );
}
