import Link from "next/link";
import { Suspense } from "react";
import { ChevronDownIcon, PlusIcon } from "./icons";
import { Logo } from "./logo";
import { HeaderCitySwitcher } from "./header-city-switcher";
import { HeaderSearch } from "./header-search";
import { NavigationProgress } from "./navigation-progress";
import { PendingSubmitButton } from "./pending-submit-button";
import { UserAvatar } from "./user-avatar";
import { getCurrentUser } from "@/lib/auth/current-user";
import { signOut } from "@/app/auth/actions";
import { resolveRequestCity } from "@/lib/location/selected-city";

export async function Header({ citySlug }: { citySlug?: string } = {}) {
  const [user, city] = await Promise.all([getCurrentUser(), resolveRequestCity(citySlug)]);
  const resolvedCitySlug = city.slug;
  const cityQuery = `?cidade=${encodeURIComponent(resolvedCitySlug)}`;
  return (
    <><Suspense fallback={null}><NavigationProgress /></Suspense><header className="site-header">
      <div className="container header-inner">
        <Logo href={`/${cityQuery}`} />
        <nav className="desktop-nav" aria-label="Navegação principal">
          <Link prefetch={false} href={`/imoveis${cityQuery}`}>Imóveis</Link>
          <Link prefetch={false} href={`/freteiros${cityQuery}`}>Freteiros</Link>
        </nav>
        <div className="header-location">
          <span className="header-location__label">Onde você procura?</span>
          <Suspense fallback={<span className="city-switcher">Escolher cidade <ChevronDownIcon /></span>}>
            <HeaderCitySwitcher defaultCitySlug={resolvedCitySlug} />
          </Suspense>
        </div>
        <div className="header-actions">
          <HeaderSearch citySlug={resolvedCitySlug} />
          {user ? (
            <details className="user-menu">
              <summary><UserAvatar image={user.image} name={user.name} /><span>{user.name?.split(" ")[0] || "Minha conta"}</span><ChevronDownIcon /></summary>
              <div className="user-menu__panel">
                <div className="user-menu__identity"><strong>{user.name || "Usuário"}</strong><small>{user.email}</small></div>
                <Link prefetch={false} href="/perfil">Meu perfil</Link>
                <Link prefetch={false} href="/meus-anuncios">Meus anúncios</Link>
                {user.role === "ADMIN" ? <Link prefetch={false} href="/admin/anuncios">Moderar anúncios</Link> : null}
                <Link prefetch={false} href="/favoritos">Favoritos <small>em breve</small></Link>
                <form action={signOut}><PendingSubmitButton pendingText="Saindo...">Sair</PendingSubmitButton></form>
              </div>
            </details>
          ) : (
            <Link prefetch={false} className="login-link" href="/entrar">Entrar</Link>
          )}
          <Link prefetch={false} className="button button--primary button--sm" href="/publicar">
            <PlusIcon size={18} /> Publicar grátis
          </Link>
        </div>
      </div>
    </header></>
  );
}
