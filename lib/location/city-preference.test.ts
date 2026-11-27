import { describe, expect, it } from "vitest";
import { DEFAULT_CITY_SLUG, pickCitySlug } from "./city-preference";

describe("cidade dos links do cabeçalho", () => {
  it("a cidade escolhida na página vale mais que a salva antes", () => {
    expect(pickCitySlug("ibirama", "rio-do-sul")).toBe("ibirama");
  });

  it("sem cidade na página, usa a salva no navegador", () => {
    expect(pickCitySlug(undefined, "ituporanga")).toBe("ituporanga");
  });

  it("sem nenhuma das duas, usa a cidade padrão", () => {
    expect(pickCitySlug(undefined, undefined)).toBe(DEFAULT_CITY_SLUG);
  });

  it("ignora valor estranho no cookie", () => {
    expect(pickCitySlug(undefined, "<script>")).toBe(DEFAULT_CITY_SLUG);
  });
});
