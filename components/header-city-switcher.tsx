"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDownIcon, PinIcon } from "./icons";
import { CITY_COOKIE_MAX_AGE, CITY_COOKIE_NAME } from "@/lib/location/city-preference";

type CityOption = {
  id: string;
  name: string;
  slug: string;
  stateCode: string;
};

// A lista de cidades muda raramente: uma busca por carregamento de página basta,
// mesmo com o cabeçalho remontando a cada navegação.
let citiesRequest: Promise<CityOption[]> | null = null;

function loadCities() {
  citiesRequest ??= fetch("/api/localizacoes/cidades")
    .then(response => {
      if (!response.ok) throw new Error("Falha ao carregar cidades");
      return response.json() as Promise<CityOption[]>;
    })
    .catch(error => {
      citiesRequest = null;
      throw error;
    });
  return citiesRequest;
}

export function HeaderCitySwitcher({ defaultCitySlug = "rio-do-sul" }: { defaultCitySlug?: string }) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const [cities, setCities] = useState<CityOption[]>([]);
  const [loadFailed, setLoadFailed] = useState(false);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const selectedSlug = searchParams.get("cidade") || defaultCitySlug;
  const selectedCity = cities.find(city => city.slug === selectedSlug);
  const isPropertyCatalog = pathname === "/imoveis" || /^\/[^/]+\/imoveis(?:\/(?:aluguel|venda)(?:\/[^/]+)?)?$/.test(pathname);
  const isFreighterCatalog = pathname === "/freteiros" || /^\/[^/]+\/freteiros$/.test(pathname);

  function cityHref(citySlug: string) {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("cidade");
    next.delete("pagina");
    next.delete("bairro");

    if (pathname === "/") {
      next.set("cidade", citySlug);
      return `/?${next.toString()}`;
    }

    if (isPropertyCatalog) {
      // Mantém a finalidade ao trocar de cidade; o bairro pertence à cidade anterior e é descartado.
      const purpose = pathname.match(/\/imoveis\/(aluguel|venda)(?:\/|$)/)?.[1] ?? next.get("finalidade");
      next.delete("finalidade");
      const query = next.toString();
      const purposePath = purpose === "aluguel" || purpose === "venda" ? `/${purpose}` : "";
      return `/${citySlug}/imoveis${purposePath}${query ? `?${query}` : ""}`;
    }

    if (isFreighterCatalog) {
      const query = next.toString();
      return `/${citySlug}/freteiros${query ? `?${query}` : ""}`;
    }

    return `/${citySlug}/imoveis`;
  }

  useEffect(() => {
    let active = true;
    loadCities()
      .then(result => { if (active) setCities(result); })
      .catch(() => { if (active) setLoadFailed(true); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const queryCity = searchParams.get("cidade");
    if (!queryCity) return;
    document.cookie = `${CITY_COOKIE_NAME}=${encodeURIComponent(queryCity)}; Path=/; Max-Age=${CITY_COOKIE_MAX_AGE}; SameSite=Lax`;
  }, [searchParams]);

  useEffect(() => {
    function close(event: KeyboardEvent | PointerEvent) {
      const details = detailsRef.current;
      if (!details?.open) return;
      if (event instanceof KeyboardEvent && event.key === "Escape") {
        details.open = false;
        details.querySelector("summary")?.focus();
      } else if (event instanceof PointerEvent && event.target instanceof Node && !details.contains(event.target)) {
        details.open = false;
      }
    }
    document.addEventListener("keydown", close);
    document.addEventListener("pointerdown", close, { passive: true });
    return () => {
      document.removeEventListener("keydown", close);
      document.removeEventListener("pointerdown", close);
    };
  }, []);

  return (
    <details className="city-menu" ref={detailsRef}>
      <summary className="city-switcher" aria-label={`Escolher cidade: ${selectedCity?.name || (selectedSlug === "rio-do-sul" ? "Rio do Sul" : "Escolher cidade")}`}>
        <PinIcon size={18} />
        <span>{selectedCity?.name || (selectedSlug === "rio-do-sul" ? "Rio do Sul" : "Escolher cidade")}</span>
        <ChevronDownIcon />
      </summary>
      <div className="city-menu__panel">
        <div className="city-menu__heading">
          <PinIcon size={17} />
          <div><strong>Escolha sua cidade</strong><small>Veja anúncios e serviços disponíveis nela</small></div>
        </div>
        <div className="city-menu__list">
          {!cities.length && !loadFailed ? <span className="city-menu__status" role="status">Carregando cidades…</span> : null}
          {loadFailed ? <span className="city-menu__status" role="alert">Não foi possível carregar. Tente novamente.</span> : null}
          {cities.map(city => (
            <Link prefetch={false}
              href={cityHref(city.slug)}
              key={city.id}
              aria-current={city.slug === selectedSlug ? "page" : undefined}
              onClick={() => {
                document.cookie = `${CITY_COOKIE_NAME}=${encodeURIComponent(city.slug)}; Path=/; Max-Age=${CITY_COOKIE_MAX_AGE}; SameSite=Lax`;
                if (detailsRef.current) detailsRef.current.open = false;
              }}
            >
              <span>{city.name}</span><small>{city.stateCode}</small>
            </Link>
          ))}
        </div>
      </div>
    </details>
  );
}
