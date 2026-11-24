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
 * Só vale quando a página é aberta de verdade (URL digitada, link de fora, recarregar):
 * `Sec-Fetch-Dest: document`. As requisições internas do Next (navegação e pré-carregamento)
 * chegam aqui sem os cabeçalhos de pré-carregamento e sem `_rsc`, que o Next retira antes
 * do proxy. O pré-carregamento pede `/imoveis` sem a query e o Next guarda a resposta para
 * qualquer `/imoveis?...`: um redirecionamento ali fazia o clique em "Toda a região"
 * (`/imoveis?regiao=1`) cair na cidade salva. Links internos para essas páginas usam
 * components/saved-city-link.tsx, que abre a página de verdade.
 */
export function savedCityRedirectSearch({ method, pathname, searchParams, headers, savedCity }: RedirectRequest) {
  if (method !== "GET" && method !== "HEAD") return null;
  // Sem o cabeçalho (navegador antigo, robô), trata como abertura da página.
  const destination = headers.get("sec-fetch-dest");
  if (destination && destination !== "document") return null;

  const usesSavedCity = pathname === "/" || pathname === "/freteiros"
    || (pathname === "/imoveis" && searchParams.get("regiao") !== "1");
  if (!usesSavedCity || searchParams.has("cidade")) return null;

  const slug = normalizeCitySlug(savedCity);
  if (!slug) return null;
  const next = new URLSearchParams(searchParams);
  next.set("cidade", slug);
  return `?${next.toString()}`;
}
