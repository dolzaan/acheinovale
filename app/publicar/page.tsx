import Link from "next/link";
import { Header } from "@/components/header";
import { MobileNav } from "@/components/mobile-nav";
import { PublishConversionEvent } from "@/components/publish-conversion-event";
import { HomeIcon, TruckIcon, ArrowIcon } from "@/components/icons";

export default function PublishPage() {
  return (
    <>
      <PublishConversionEvent name="publish_landing_view" />
      <Header />
      <main className="account-page">
        <div className="container publish-page">
          <div className="account-heading">
            <span className="section-kicker">Anuncie para sua região</span>
            <h1>O que você quer anunciar?</h1>
            <p>Escolha uma opção para começar. Você só precisará entrar na sua conta quando for continuar com a publicação.</p>
          </div>

          <div className="publish-options">
            <Link href="/publicar/imovel">
              <span><HomeIcon size={34}/></span>
              <div>
                <strong>Um imóvel</strong>
                <p>Casa, apartamento, terreno ou espaço comercial para venda ou aluguel.</p>
              </div>
              <ArrowIcon/>
            </Link>
            <Link href="/publicar/frete">
              <span><TruckIcon size={34}/></span>
              <div>
                <strong>Meu serviço de frete</strong>
                <p>Apresente seu serviço, os veículos e as cidades que você atende.</p>
              </div>
              <ArrowIcon/>
            </Link>
          </div>

          <section className="account-card" style={{ marginTop: 24, padding: 26 }}>
            <h2 style={{ marginTop: 0, fontSize: 20 }}>Como funciona?</h2>
            <ol style={{ display: "grid", gap: 12, paddingLeft: 22, color: "var(--ink-2)", fontSize: 13, lineHeight: 1.65 }}>
              <li><strong>Escolha o tipo de anúncio.</strong> Comece pelo imóvel ou pelo serviço que deseja divulgar.</li>
              <li><strong>Entre ou crie sua conta.</strong> Isso permite editar seu anúncio e receber contatos com segurança.</li>
              <li><strong>Preencha os dados e envie.</strong> Você poderá acompanhar o status na área “Meus anúncios”.</li>
            </ol>
            <p style={{ margin: "16px 0 0", color: "var(--muted)", fontSize: 12 }}>A publicação básica é gratuita. Não precisa pagar para começar.</p>
          </section>

          <p style={{ marginTop: 22, textAlign: "center", color: "var(--muted)", fontSize: 12 }}>
            Já publicou antes? <Link href="/meus-anuncios" style={{ color: "var(--green-dark)", fontWeight: 800, textDecoration: "underline" }}>Acesse seus anúncios</Link>.
          </p>
        </div>
      </main>
      <MobileNav />
    </>
  );
}
