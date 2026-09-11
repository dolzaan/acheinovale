import Link from "next/link";
import { BuildingIcon, HomeIcon, PlusIcon, TruckIcon, UserIcon } from "./icons";
import { getCurrentUser } from "@/lib/auth/current-user";
import { resolveRequestCity } from "@/lib/location/selected-city";

export async function MobileNav({ citySlug }: { citySlug?: string } = {}) {
  const [user, city] = await Promise.all([getCurrentUser(), resolveRequestCity(citySlug)]);
  const cityQuery = `?cidade=${encodeURIComponent(city.slug)}`;
  return (
    <nav className="mobile-nav" aria-label="Navegação mobile">
      <Link className="mobile-nav__item is-active" href={`/${cityQuery}`}><HomeIcon/><span>Início</span></Link>
      <Link className="mobile-nav__item" href={`/imoveis${cityQuery}`}><BuildingIcon/><span>Imóveis</span></Link>
      <Link className="mobile-nav__publish" href="/publicar" aria-label="Publicar anúncio">
        <span className="mobile-nav__publish-icon" aria-hidden="true"><PlusIcon size={26}/></span>
        <span className="mobile-nav__publish-label">Publicar</span>
      </Link>
      <Link className="mobile-nav__item" href={`/freteiros${cityQuery}`}><TruckIcon/><span>Freteiros</span></Link>
      <Link className="mobile-nav__item" href={user ? "/perfil" : "/entrar?next=/perfil"}><UserIcon/><span>{user ? "Perfil" : "Entrar"}</span></Link>
    </nav>
  );
}
