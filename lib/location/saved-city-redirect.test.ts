import { describe, expect, it } from "vitest";
import { savedCityRedirectSearch } from "./saved-city-redirect";

function request(path: string, options: { headers?: Record<string, string>; savedCity?: string; method?: string } = {}) {
  const url = new URL(path, "https://acheinovale.vercel.app");
  return {
    method: options.method ?? "GET",
    pathname: url.pathname,
    searchParams: url.searchParams,
    headers: new Headers(options.headers),
    savedCity: "savedCity" in options ? options.savedCity : "agronomica",
  };
}

describe("cidade salva do visitante", () => {
  it("leva o catálogo sem cidade para a cidade escolhida, mantendo os filtros", () => {
    expect(savedCityRedirectSearch(request("/imoveis?finalidade=aluguel"))).toBe("?finalidade=aluguel&cidade=agronomica");
    expect(savedCityRedirectSearch(request("/"))).toBe("?cidade=agronomica");
  });

  it("não tira o visitante da busca em toda a região", () => {
    expect(savedCityRedirectSearch(request("/imoveis?regiao=1"))).toBeNull();
  });

  it("só redireciona quando a página é aberta de verdade, nunca nas requisições internas do Next", () => {
    // O Next pré-carrega /imoveis sem a query. Se isto voltar a redirecionar, o clique em
    // "Toda a região" cai na cidade salva.
    expect(savedCityRedirectSearch(request("/imoveis", { headers: { "Sec-Fetch-Dest": "empty" } }))).toBeNull();
    expect(savedCityRedirectSearch(request("/imoveis", { headers: { "Sec-Fetch-Dest": "document" } }))).toBe("?cidade=agronomica");
  });

  it("respeita a cidade que já está na URL", () => {
    expect(savedCityRedirectSearch(request("/imoveis?cidade=ibirama"))).toBeNull();
  });

  it("não faz nada sem cidade salva ou com cookie adulterado", () => {
    expect(savedCityRedirectSearch(request("/imoveis", { savedCity: undefined }))).toBeNull();
    expect(savedCityRedirectSearch(request("/imoveis", { savedCity: "../admin" }))).toBeNull();
  });

  it("não mexe em envios de formulário nem em outras páginas", () => {
    expect(savedCityRedirectSearch(request("/imoveis", { method: "POST" }))).toBeNull();
    expect(savedCityRedirectSearch(request("/imovel/abc/casa"))).toBeNull();
  });
});
