import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { SiteFooter } from "@/components/footer";
import { OBJETOS_3D, Objeto3D } from "@/components/objeto-3d";
import { ArrowIcon } from "@/components/icons";

// Página interna para comparar os objetos 3D em fundos e tamanhos da marca.
export const metadata: Metadata = {
  title: "Vitrine 3D",
  robots: { index: false, follow: false },
};

const FUNDOS = [
  { classe: "creme", nome: "Creme #fff9ec" },
  { classe: "branco", nome: "Branco" },
  { classe: "verde", nome: "Verde #1d402d" },
] as const;

export default function Vitrine3DPage() {
  return (
    <>
      <Header />
      <main className="container vitrine-3d">
        <h1>Vitrine 3D</h1>
        <p>Todos os objetos 3D do site, nos fundos e tamanhos em que aparecem. Para trocar um objeto, substitua o arquivo em <code>public/3d/</code> mantendo o nome.</p>

        <h2>Nos fundos da marca</h2>
        <div className="vitrine-3d__fundos">
          {FUNDOS.map(fundo => (
            <div key={fundo.classe} className={`vitrine-3d__fundo vitrine-3d__fundo--${fundo.classe}`}>
              <strong>{fundo.nome}</strong>
              <div className="vitrine-3d__grade">
                {OBJETOS_3D.map(nome => (
                  <div key={nome} className="vitrine-3d__item"><Objeto3D nome={nome} tamanho={56} /><span>{nome}</span></div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <h2>Tamanhos</h2>
        <div className="vitrine-3d__tamanhos">
          {[32, 52, 58, 96, 160].map(tamanho => (
            <figure key={tamanho}><Objeto3D nome="casa" tamanho={tamanho} /><figcaption>{tamanho}px</figcaption></figure>
          ))}
        </div>

        <h2>Movimento</h2>
        <div className="vitrine-3d__tamanhos">
          <figure><Objeto3D nome="casa" tamanho={96} flutuar /><figcaption>flutuar</figcaption></figure>
          <figure><Objeto3D nome="caminhao" tamanho={96} flutuar /><figcaption>flutuar</figcaption></figure>
          <figure>
            <Link className="category-card category-card--property" href="/vitrine-3d" style={{ minWidth: 320 }}>
              <span className="category-card__icon category-card__icon--3d"><Objeto3D nome="casa" tamanho={72} /></span>
              <span className="category-card__copy"><small>Passe o mouse</small><strong>Card da home</strong></span>
              <span className="category-card__arrow"><ArrowIcon /></span>
            </Link>
            <figcaption>hover no card</figcaption>
          </figure>
        </div>

        <h2>Como fica na home</h2>
        <div className="category-grid">
          <Link className="category-card category-card--property" href="/vitrine-3d">
            <span className="category-card__icon category-card__icon--3d"><Objeto3D nome="casa" tamanho={72} /></span>
            <span className="category-card__copy"><small>Quero encontrar</small><strong>Um imóvel</strong><span>Casas, apartamentos e terrenos</span></span>
            <span className="category-card__arrow"><ArrowIcon /></span>
          </Link>
          <Link className="category-card category-card--freight" href="/vitrine-3d">
            <span className="category-card__icon category-card__icon--3d"><Objeto3D nome="caminhao" tamanho={72} /></span>
            <span className="category-card__copy"><small>Preciso de</small><strong>Um freteiro</strong><span>Mudanças, entregas e transportes</span></span>
            <span className="category-card__arrow"><ArrowIcon /></span>
          </Link>
        </div>
        <p className="home-empty-note home-empty-note--3d"><Objeto3D nome="lupa" tamanho={52} /><span>Ainda não há imóveis anunciados nesta cidade. <Link href="/vitrine-3d">Criar um alerta</Link> para saber quando aparecer.</span></p>
        <section className="publish-banner" style={{ marginTop: 32 }}>
          <div className="publish-banner__art publish-banner__art--3d" aria-hidden="true"><Objeto3D nome="casa" tamanho={96} flutuar /><Objeto3D nome="chave" tamanho={96} flutuar /><Objeto3D nome="caminhao" tamanho={96} flutuar /></div>
          <div><h2>Tem algo para anunciar?</h2><p>Anuncie seu imóvel ou serviço de frete para gente da região. É grátis.</p></div>
          <Link className="button button--light" href="/vitrine-3d">Anunciar grátis</Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
