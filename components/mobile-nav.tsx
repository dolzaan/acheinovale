import Link from "next/link";
import { BuildingIcon, HomeIcon, PlusIcon, TruckIcon, UserIcon } from "./icons";

export function MobileNav() {
  return (
    <nav className="mobile-nav" aria-label="Navegação mobile">
      <Link className="mobile-nav__item is-active" href="/"><HomeIcon/><span>Início</span></Link>
      <Link className="mobile-nav__item" href="/rio-do-sul/imoveis"><BuildingIcon/><span>Imóveis</span></Link>
      <Link className="mobile-nav__publish" href="/publicar" aria-label="Publicar anúncio"><PlusIcon size={26}/></Link>
      <Link className="mobile-nav__item" href="/rio-do-sul/freteiros"><TruckIcon/><span>Freteiros</span></Link>
      <Link className="mobile-nav__item" href="/perfil"><UserIcon/><span>Perfil</span></Link>
    </nav>
  );
}
