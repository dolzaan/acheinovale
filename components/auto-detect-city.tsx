"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { CITY_COOKIE_MAX_AGE, CITY_COOKIE_NAME, normalizeCitySlug } from "@/lib/location/city-preference";

// Quem já tem a cidade salva é redirecionado no proxy.ts antes da renderização;
// aqui só resta detectar a cidade por IP na primeira visita.
export function AutoDetectCity() {
  const router = useRouter();

  useEffect(() => {
    if (window.location.pathname !== "/") return;

    const currentUrl = new URL(window.location.href);
    if (currentUrl.searchParams.has("cidade")) return;

    const controller = new AbortController();
    fetch("/api/localizacoes/minha-cidade", {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      cache: "no-store",
    })
      .then(response => response.ok ? response.json() : null)
      .then((result: { slug?: string } | null) => {
        const slug = normalizeCitySlug(result?.slug);
        if (controller.signal.aborted || !slug) return;
        document.cookie = `${CITY_COOKIE_NAME}=${encodeURIComponent(slug)}; Path=/; Max-Age=${CITY_COOKIE_MAX_AGE}; SameSite=Lax`;
        currentUrl.searchParams.set("cidade", slug);
        router.replace(`${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`, { scroll: false });
      })
      .catch(() => {
        // Se a localização por IP não estiver disponível, mantém a cidade padrão.
      });

    return () => controller.abort();
  }, [router]);

  return null;
}
