import Link from "next/link";
import { ChevronDownIcon, PlusIcon } from "./icons";
import { Logo } from "./logo";

export function Header() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Logo />
        <nav className="desktop-nav" aria-label="Navegação principal">
          <Link href="/rio-do-sul/imoveis">Imóveis</Link>
          <Link href="/rio-do-sul/freteiros">Freteiros</Link>
          <button className="city-switcher" type="button">
            Rio do Sul <ChevronDownIcon />
          </button>
        </nav>
        <div className="header-actions">
          <Link className="login-link" href="/entrar">Entrar</Link>
          <Link className="button button--primary button--sm" href="/publicar">
            <PlusIcon size={18} /> Publicar grátis
          </Link>
        </div>
      </div>
    </header>
  );
}
