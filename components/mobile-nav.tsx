import Link from "next/link";
import { BuildingIcon, HomeIcon, PlusIcon, TruckIcon, UserIcon } from "./icons";
import { getCurrentUser } from "@/lib/auth/current-user";

export async function MobileNav() {
  const user = await getCurrentUser();
  return (
    <nav className="mobile-nav" aria-label="Navegação mobile">
      <Link className="mobile-nav__item is-active" href="/"><HomeIcon/><span>Início</span></Link>
      <Link className="mobile-nav__item" href="/imoveis"><BuildingIcon/><span>Imóveis</span></Link>
      <Link className="mobile-nav__publish" href="/publicar" aria-label="Publicar anúncio"><PlusIcon size={26}/></Link>
      <Link className="mobile-nav__item" href="/freteiros"><TruckIcon/><span>Freteiros</span></Link>
      <Link className="mobile-nav__item" href={user ? "/perfil" : "/entrar?next=/perfil"}><UserIcon/><span>{user ? "Perfil" : "Entrar"}</span></Link>
    </nav>
  );
}
