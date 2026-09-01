"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDownIcon, PinIcon } from "./icons";

type CityOption = {
  id: string;
  name: string;
  slug: string;
  stateCode: string;
};

export function HeaderCitySwitcher() {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const [cities, setCities] = useState<CityOption[]>([]);
  const [loadFailed, setLoadFailed] = useState(false);
  const searchParams = useSearchParams();
  const selectedSlug = searchParams.get("cidade") || "rio-do-sul";
  const selectedCity = cities.find(city => city.slug === selectedSlug) ?? cities.find(city => city.slug === "rio-do-sul");

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/localizacoes/cidades", { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error("Falha ao carregar cidades");
        return response.json() as Promise<CityOption[]>;
      })
      .then(setCities)
      .catch(error => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setLoadFailed(true);
      });

    return () => controller.abort();
  }, []);

  return (
    <details className="city-menu" ref={detailsRef}>
      <summary className="city-switcher" aria-label="Escolher cidade">
        <span>{selectedCity?.name || (selectedSlug === "rio-do-sul" ? "Rio do Sul" : "Escolher cidade")}</span>
        <ChevronDownIcon />
      </summary>
      <div className="city-menu__panel">
        <div className="city-menu__heading">
          <PinIcon size={17} />
          <div><strong>Escolha sua cidade</strong><small>Veja os imóveis disponíveis nela</small></div>
        </div>
        <div className="city-menu__list">
          {!cities.length && !loadFailed ? <span className="city-menu__status">Carregando cidades...</span> : null}
          {loadFailed ? <span className="city-menu__status">Não foi possível carregar. Tente novamente.</span> : null}
          {cities.map(city => (
            <Link
              href={`/imoveis?cidade=${city.slug}`}
              key={city.id}
              aria-current={city.slug === selectedSlug ? "page" : undefined}
              onClick={() => { if (detailsRef.current) detailsRef.current.open = false; }}
            >
              <span>{city.name}</span><small>{city.stateCode}</small>
            </Link>
          ))}
        </div>
      </div>
    </details>
  );
}
