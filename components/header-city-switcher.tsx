"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDownIcon, PinIcon } from "./icons";
import { CITY_COOKIE_MAX_AGE, CITY_COOKIE_NAME } from "@/lib/location/city-preference";

type CityOption = { id: string; name: string; slug: string; stateCode: string };
type DetectedCity = { slug: string; error?: string };
const MANUAL_CITY_KEY = "achei_no_vale_manual_city";

export function HeaderCitySwitcher({ defaultCitySlug = "rio-do-sul" }: { defaultCitySlug?: string }) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const [cities, setCities] = useState<CityOption[]>([]);
  const [loadFailed, setLoadFailed] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const selectedSlug = searchParams.get("cidade") || defaultCitySlug;
  const selectedCity = cities.find(city => city.slug === selectedSlug);
  const destination = pathname === "/" || pathname.startsWith("/freteiros") || pathname.startsWith("/imoveis") ? pathname : "/imoveis";

  function cityHref(citySlug: string) {
    const next = new URLSearchParams(searchParams.toString());
    next.set("cidade", citySlug);
    next.delete("pagina");
    if (destination.startsWith("/imoveis")) next.delete("bairro");
    return `${destination}?${next.toString()}`;
  }

  function useMyLocation() {
    setLocationMessage("");
    if (!window.isSecureContext) {
      setLocationMessage("A localização precisa de uma conexão segura (HTTPS).");
      return;
    }
    if (!("geolocation" in navigator)) {
      setLocationMessage("Localização não disponível neste navegador.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async position => {
        try {
          const response = await fetch(`/api/localizacoes/detectar?latitude=${encodeURIComponent(position.coords.latitude)}&longitude=${encodeURIComponent(position.coords.longitude)}`);
          const detected = (await response.json()) as DetectedCity;
          if (!response.ok || !detected.slug) {
            setLocationMessage(detected.error || "Não foi possível identificar sua cidade.");
            return;
          }
          if (!cities.some(city => city.slug === detected.slug)) {
            setLocationMessage("Sua cidade ainda não está disponível no Achei no Vale.");
            return;
          }
          localStorage.removeItem(MANUAL_CITY_KEY);
          document.cookie = `${CITY_COOKIE_NAME}=${encodeURIComponent(detected.slug)}; Path=/; Max-Age=${CITY_COOKIE_MAX_AGE}; SameSite=Lax`;
          if (detailsRef.current) detailsRef.current.open = false;
          router.replace(cityHref(detected.slug));
        } catch {
          setLocationMessage("Não foi possível detectar sua cidade. Tente novamente.");
        } finally {
          setLocating(false);
        }
      },
      error => {
        setLocating(false);
        if (error.code === 1) setLocationMessage("Localização bloqueada. Clique no ícone ao lado do endereço do site e permita Localização.");
        else if (error.code === 3) setLocationMessage("A localização demorou para responder. Tente novamente.");
        else setLocationMessage("Não foi possível obter sua localização.");
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 },
    );
  }

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/localizacoes/cidades", { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error("Falha ao carregar cidades"); return response.json() as Promise<CityOption[]>; })
      .then(setCities)
      .catch(error => { if (error instanceof DOMException && error.name === "AbortError") return; setLoadFailed(true); });
    return () => controller.abort();
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
      if (event instanceof KeyboardEvent && event.key === "Escape") { details.open = false; details.querySelector("summary")?.focus(); }
      else if (event instanceof PointerEvent && event.target instanceof Node && !details.contains(event.target)) details.open = false;
    }
    document.addEventListener("keydown", close);
    document.addEventListener("pointerdown", close);
    return () => { document.removeEventListener("keydown", close); document.removeEventListener("pointerdown", close); };
  }, []);

  return (
    <details className="city-menu" ref={detailsRef}>
      <summary className="city-switcher" aria-label={`Escolher cidade: ${selectedCity?.name || (selectedSlug === "rio-do-sul" ? "Rio do Sul" : "Escolher cidade")}`}>
        <PinIcon size={18} />
        <span>{selectedCity?.name || (selectedSlug === "rio-do-sul" ? "Rio do Sul" : "Escolher cidade")}</span>
        <ChevronDownIcon />
      </summary>
      <div className="city-menu__panel">
        <div className="city-menu__heading"><PinIcon size={17} /><div><strong>Escolha sua cidade</strong><small>Veja anúncios e serviços disponíveis nela</small></div></div>
        <button className="city-menu__location" type="button" onClick={useMyLocation} disabled={locating}>
          <span className="city-menu__location-icon"><PinIcon size={17} /></span>
          <span className="city-menu__location-copy"><strong>{locating ? "Buscando sua cidade..." : "Usar minha localização"}</strong><small>{locating ? "Aguarde um instante" : "Detectar automaticamente"}</small></span>
        </button>
        {locationMessage ? <span className="city-menu__status city-menu__status--location">{locationMessage}</span> : null}
        <div className="city-menu__list">
          {!cities.length && !loadFailed ? <span className="city-menu__status">Carregando cidades...</span> : null}
          {loadFailed ? <span className="city-menu__status">Não foi possível carregar. Tente novamente.</span> : null}
          {cities.map(city => (
            <Link href={cityHref(city.slug)} key={city.id} aria-current={city.slug === selectedSlug ? "page" : undefined} onClick={() => {
              localStorage.setItem(MANUAL_CITY_KEY, city.slug);
              document.cookie = `${CITY_COOKIE_NAME}=${encodeURIComponent(city.slug)}; Path=/; Max-Age=${CITY_COOKIE_MAX_AGE}; SameSite=Lax`;
              if (detailsRef.current) detailsRef.current.open = false;
            }}><span>{city.name}</span><small>{city.stateCode}</small></Link>
          ))}
        </div>
      </div>
    </details>
  );
}
