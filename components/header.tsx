import Link from "next/link";
import { Suspense } from "react";
import { ChevronDownIcon, PlusIcon } from "./icons";
import { Logo } from "./logo";
import { NavigationProgress } from "./navigation-progress";
import { PendingSubmitButton } from "./pending-submit-button";
import { UserAvatar } from "./user-avatar";
import { getCurrentUser } from "@/lib/auth/current-user";
import { signOut } from "@/app/auth/actions";

export async function Header() {
  const user = await getCurrentUser();
  return (
    <><Suspense fallback={null}><NavigationProgress /></Suspense><header className="site-header">
      <div className="container header-inner">
        <Logo />
        <nav className="desktop-nav" aria-label="Navegação principal">
          <Link href="/imoveis">Imóveis</Link>
          <Link href="/freteiros">Freteiros</Link>
          <button className="city-switcher" type="button">
            Rio do Sul <ChevronDownIcon />
          </button>
        </nav>
        <div className="header-actions">
          {user ? (
            <details className="user-menu">
              <summary><UserAvatar image={user.image} name={user.name} /><span>{user.name?.split(" ")[0] || "Minha conta"}</span><ChevronDownIcon /></summary>
              <div className="user-menu__panel">
                <div className="user-menu__identity"><strong>{user.name || "Usuário"}</strong><small>{user.email}</small></div>
                <Link href="/perfil">Meu perfil</Link>
                <Link href="/meus-anuncios">Meus anúncios</Link>
                {user.role === "ADMIN" ? <Link href="/admin/anuncios">Moderar anúncios</Link> : null}
                <Link href="/favoritos">Favoritos <small>em breve</small></Link>
                <form action={signOut}><PendingSubmitButton pendingText="Saindo...">Sair</PendingSubmitButton></form>
              </div>
            </details>
          ) : (
            <Link className="login-link" href="/entrar">Entrar</Link>
          )}
          <Link className="button button--primary button--sm" href="/publicar">
            <PlusIcon size={18} /> Publicar grátis
          </Link>
        </div>
      </div>
    </header></>
  );
}
