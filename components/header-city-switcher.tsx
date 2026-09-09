"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
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
  const pathname = usePathname();
  const selectedSlug = searchParams.get("cidade") || "rio-do-sul";
  const selectedCity = cities.find(city => city.slug === selectedSlug);

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
    document.addEventListener("pointerdown", close);
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
          <div><strong>Escolha sua cidade</strong><small>Veja os imóveis disponíveis nela</small></div>
        </div>
        <div className="city-menu__list">
          {!cities.length && !loadFailed ? <span className="city-menu__status">Carregando cidades...</span> : null}
          {loadFailed ? <span className="city-menu__status">Não foi possível carregar. Tente novamente.</span> : null}
          {cities.map(city => (
            <Link
              href={`${pathname === "/" ? "/" : "/imoveis"}?cidade=${encodeURIComponent(city.slug)}`}
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
