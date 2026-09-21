"use client";

import Link from "next/link";
import { BuildingIcon, HomeIcon, PlusIcon, TruckIcon } from "./icons";
import { MobileAccountMenu } from "./mobile-account-menu";
import { usePreferredCitySlug } from "./use-preferred-city-slug";

export function MobileNav({ citySlug }: { citySlug?: string } = {}) {
  const resolvedCitySlug = usePreferredCitySlug(citySlug);
  const cityQuery = `?cidade=${encodeURIComponent(resolvedCitySlug)}`;
  const propertiesHref = `/${resolvedCitySlug}/imoveis`;
  const freightersHref = `/${resolvedCitySlug}/freteiros`;
  return (
    <nav className="mobile-nav" aria-label="Navegação mobile">
      <Link prefetch={false} className="mobile-nav__item is-active" href={`/${cityQuery}`}><HomeIcon/><span>Início</span></Link>
      <Link prefetch={false} className="mobile-nav__item" href={propertiesHref}><BuildingIcon/><span>Imóveis</span></Link>
      <Link prefetch={false} className="mobile-nav__publish" href="/publicar" aria-label="Publicar anúncio">
        <span className="mobile-nav__publish-icon" aria-hidden="true"><PlusIcon size={26}/></span>
        <span className="mobile-nav__publish-label">Publicar</span>
      </Link>
      <Link prefetch={false} className="mobile-nav__item" href={freightersHref}><TruckIcon/><span>Freteiros</span></Link>
      <MobileAccountMenu />
    </nav>
  );
}
