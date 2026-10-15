"use client";

import { useEffect } from "react";
import { CITY_COOKIE_MAX_AGE, CITY_COOKIE_NAME, normalizeCitySlug } from "@/lib/location/city-preference";

export function AutoDetectCity() {
  useEffect(() => {
    if (window.location.pathname !== "/") return;

    const currentUrl = new URL(window.location.href);
    if (currentUrl.searchParams.has("cidade")) return;

    const cookie = document.cookie
      .split(";")
      .map(value => value.trim())
      .find(value => value.startsWith(`${CITY_COOKIE_NAME}=`));

    const savedSlug = cookie
      ? normalizeCitySlug(decodeURIComponent(cookie.slice(cookie.indexOf("=") + 1)))
      : undefined;

    function navigateToCity(slug: string) {
      const normalizedSlug = normalizeCitySlug(slug);
      if (!normalizedSlug) return;
      document.cookie = `${CITY_COOKIE_NAME}=${encodeURIComponent(normalizedSlug)}; Path=/; Max-Age=${CITY_COOKIE_MAX_AGE}; SameSite=Lax`;
      currentUrl.searchParams.set("cidade", normalizedSlug);
      window.location.replace(currentUrl.toString());
    }

    if (savedSlug) {
      navigateToCity(savedSlug);
      return;
    }

    const controller = new AbortController();
    fetch("/api/localizacoes/minha-cidade", {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      cache: "no-store",
    })
      .then(response => response.ok ? response.json() : null)
      .then((result: { slug?: string } | null) => {
        if (!controller.signal.aborted && result?.slug) navigateToCity(result.slug);
      })
      .catch(() => {
        // Se a localização por IP não estiver disponível, mantém a cidade padrão.
      });

    return () => controller.abort();
  }, []);

  return null;
}
