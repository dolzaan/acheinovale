import type { ReactNode } from "react";
import Link from "next/link";
import { Header } from "./header";
import { MobileNav } from "./mobile-nav";
import { SiteFooter } from "./footer";

type SupportPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  current: "seguranca" | "ajuda";
  children: ReactNode;
};

export function SupportPage({ eyebrow, title, description, current, children }: SupportPageProps) {
  return (
    <>
      <Header />
      <main className="legal-page support-page">
        <div className="container legal-layout">
          <header className="legal-heading">
            <span className="section-kicker">{eyebrow}</span>
            <h1>{title}</h1>
            <p>{description}</p>
          </header>

          <article className="legal-content support-content">{children}</article>

          <aside className="legal-help support-contact">
            <div>
              <strong>Ainda precisa de ajuda?</strong>
              <p>Converse diretamente com o Achei no Vale pelo WhatsApp.</p>
            </div>
            <Link className="button button--primary" href="/contato">
              Falar no WhatsApp
            </Link>
          </aside>

          <nav className="legal-switcher support-switcher" aria-label="Guias de ajuda">
            <Link href="/seguranca" aria-current={current === "seguranca" ? "page" : undefined}>Segurança</Link>
            <Link href="/ajuda" aria-current={current === "ajuda" ? "page" : undefined}>Central de ajuda</Link>
            <Link href="/contato">Fale conosco</Link>
          </nav>
        </div>
      </main>
      <SiteFooter />
      <MobileNav />
    </>
  );
}
