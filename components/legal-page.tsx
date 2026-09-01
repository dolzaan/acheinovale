import Link from "next/link";
import { Header } from "./header";
import { MobileNav } from "./mobile-nav";
import { SiteFooter } from "./footer";

type LegalPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
};

export function LegalPage({ eyebrow, title, description, children }: LegalPageProps) {
  return (
    <>
      <Header />
      <main className="legal-page">
        <div className="container legal-layout">
          <header className="legal-heading">
            <span className="section-kicker">{eyebrow}</span>
            <h1>{title}</h1>
            <p>{description}</p>
            <small>Última atualização: 1º de setembro de 2026</small>
          </header>
          <article className="legal-content">{children}</article>
          <aside className="legal-help">
            <strong>Ficou com alguma dúvida?</strong>
            <p>Fale com a equipe do AcheiNoVale pelo e-mail <a href="mailto:contato@acheinovale.com.br">contato@acheinovale.com.br</a>.</p>
          </aside>
          <nav className="legal-switcher" aria-label="Documentos legais">
            <Link href="/termos">Termos de Uso</Link>
            <Link href="/privacidade">Política de Privacidade</Link>
          </nav>
        </div>
      </main>
      <SiteFooter />
      <MobileNav />
    </>
  );
}
