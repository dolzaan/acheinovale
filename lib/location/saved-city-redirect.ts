import { normalizeCitySlug } from "@/lib/location/city-preference";

type RedirectRequest = {
  method: string;
  pathname: string;
  searchParams: URLSearchParams;
  headers: Headers;
  savedCity: string | undefined;
};

/**
 * Para onde levar quem já escolheu a cidade e abriu a home ou um catálogo sem cidade na URL.
 * Devolve null quando a página deve abrir como está.
 *
 * Pré-carregamentos do Next nunca são redirecionados: o Next pede a estrutura de
 * `/imoveis` sem a query e guarda a resposta para qualquer `/imoveis?...`. Um
 * redirecionamento ali faria o clique em "Toda a região" (`/imoveis?regiao=1`)
 * cair na cidade salva.
 */
export function savedCityRedirectSearch({ method, pathname, searchParams, headers, savedCity }: RedirectRequest) {
  if (method !== "GET" && method !== "HEAD") return null;
  if (headers.has("next-router-prefetch") || headers.has("next-router-segment-prefetch")) return null;

  const usesSavedCity = pathname === "/" || pathname === "/freteiros"
    || (pathname === "/imoveis" && searchParams.get("regiao") !== "1");
  if (!usesSavedCity || searchParams.has("cidade")) return null;

  const slug = normalizeCitySlug(savedCity);
  if (!slug) return null;
  const next = new URLSearchParams(searchParams);
  next.set("cidade", slug);
  return `?${next.toString()}`;
}
