import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { MobileNav } from "@/components/mobile-nav";
import { INSTAGRAM_HANDLE, INSTAGRAM_URL, SITE_URL } from "@/lib/site";

const title = "Anuncie seus imóveis no Achei no Vale | Corretores e imobiliárias";
const description = "Corretores e imobiliárias do Alto Vale do Itajaí: publique imóveis de graça, tenha uma página com todos os seus anúncios e receba contatos direto no WhatsApp.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/anuncie` },
  openGraph: { title, description, url: `${SITE_URL}/anuncie` },
};

// Só o que o site já faz hoje. Não prometer destaque pago, integração com CRM ou importação em lote.
const benefits = [
  { title: "Página da sua imobiliária", text: "Ao marcar no perfil que você é corretor ou imobiliária, ganha um endereço próprio com todos os seus imóveis ativos para divulgar no Instagram e no WhatsApp." },
  { title: "Contato direto no WhatsApp", text: "O interessado fala com você pelo número de cada anúncio, sem intermediário e sem formulário." },
  { title: "Gente da região procurando", text: "O catálogo é organizado por cidade e bairro do Alto Vale, e quem cria um alerta recebe e-mail quando aparece um imóvel com o perfil que procura." },
  { title: "Números de cada anúncio", text: "Em “Meus anúncios” você vê quantas visualizações e cliques no WhatsApp cada imóvel teve nos últimos 30 dias." },
  { title: "Catálogo sempre em dia", text: "A cada 45 dias o site pergunta se o imóvel continua disponível. Anúncio vendido ou alugado não fica no ar enganando o cliente." },
  { title: "Publicação gratuita", text: "A publicação básica é gratuita. Cada anúncio passa por uma moderação rápida antes de aparecer." },
];

const steps = [
  { title: "Entre com sua conta Google", text: "É a mesma conta para todos os seus anúncios." },
  { title: "Complete o perfil profissional", text: "Em “Meu perfil”, escolha corretor(a) ou imobiliária e informe o nome comercial e, se quiser, o CRECI." },
  { title: "Publique os imóveis", text: "Fotos, vídeo, preço, bairro e características. Depois da aprovação, eles aparecem no catálogo e na sua página." },
];

export default function AdvertisePage() {
  return (
    <>
      <Header />
      <main id="conteudo" className="account-page advertise-page">
        <div className="container">
          <section className="advertise-hero">
            <span className="property-card__purpose">Para corretores e imobiliárias</span>
            <h1>Seus imóveis na vitrine do Alto Vale</h1>
            <p>O Achei no Vale reúne imóveis à venda e para alugar nas cidades do Alto Vale do Itajaí. Publique sua carteira, tenha uma página com todos os seus anúncios e receba os contatos direto no WhatsApp.</p>
            <div className="advertise-hero__actions">
              <Link className="button button--primary" href="/perfil">Criar perfil profissional</Link>
              <Link className="button button--secondary" href="/publicar/imovel">Anunciar um imóvel</Link>
            </div>
          </section>

          <section aria-labelledby="advertise-benefits">
            <h2 id="advertise-benefits" className="advertise-section-title">O que você ganha</h2>
            <ul className="advertise-benefits">
              {benefits.map(benefit => <li key={benefit.title}><strong>{benefit.title}</strong><p>{benefit.text}</p></li>)}
            </ul>
          </section>

          <section className="account-card advertise-steps" aria-labelledby="advertise-steps">
            <h2 id="advertise-steps" className="advertise-section-title">Como começar</h2>
            <ol>
              {steps.map(step => <li key={step.title}><strong>{step.title}.</strong> {step.text}</li>)}
            </ol>
          </section>

          <section className="advertise-contact">
            <div>
              <h2>Tem muitos imóveis para cadastrar?</h2>
              <p>Fale com a gente pelo WhatsApp e combinamos a melhor forma de colocar sua carteira no ar. Acompanhe também o <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">@{INSTAGRAM_HANDLE}</a> no Instagram.</p>
            </div>
            <Link className="button button--secondary" href="/contato">Falar com o Achei no Vale</Link>
          </section>
        </div>
      </main>
      <MobileNav />
    </>
  );
}
