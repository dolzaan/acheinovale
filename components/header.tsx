"use client";

import Link from "next/link";
import { Suspense } from "react";
import { ChevronDownIcon, PlusIcon } from "./icons";
import { Logo } from "./logo";
import { HeaderCitySwitcher } from "./header-city-switcher";
import { HeaderSearch } from "./header-search";
import { NavigationProgress } from "./navigation-progress";
import { HeaderAccount } from "./header-account";
import { usePreferredCitySlug } from "./use-preferred-city-slug";

export function Header({ citySlug }: { citySlug?: string } = {}) {
  const resolvedCitySlug = usePreferredCitySlug(citySlug);
  const cityQuery = `?cidade=${encodeURIComponent(resolvedCitySlug)}`;
  const propertiesHref = `/${resolvedCitySlug}/imoveis`;
  const freightersHref = `/${resolvedCitySlug}/freteiros`;
  return (
    <><Suspense fallback={null}><NavigationProgress /></Suspense><header className="site-header">
      <div className="container header-inner">
        <Logo href={`/${cityQuery}`} />
        <nav className="desktop-nav" aria-label="Navegação principal">
          <Link prefetch={false} href={propertiesHref}>Imóveis</Link>
          <Link prefetch={false} href={freightersHref}>Freteiros</Link>
        </nav>
        <div className="header-location">
          <span className="header-location__label">Onde você procura?</span>
          <Suspense fallback={<span className="city-switcher">Escolher cidade <ChevronDownIcon /></span>}>
            <HeaderCitySwitcher defaultCitySlug={resolvedCitySlug} />
          </Suspense>
        </div>
        <div className="header-actions">
          <HeaderSearch citySlug={resolvedCitySlug} />
          <HeaderAccount />
          <Link prefetch={false} className="button button--primary button--sm" href="/publicar">
            <PlusIcon size={18} /> Publicar grátis
          </Link>
        </div>
      </div>
    </header></>
  );
}
