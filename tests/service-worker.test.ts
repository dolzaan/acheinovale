import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";

// Carrega o public/sw.js de verdade, com um `self` falso, e testa a regra de cache.
const source = readFileSync(join(__dirname, "..", "public/sw.js"), "utf8");
const context: Record<string, unknown> = { URL, self: { addEventListener() {}, location: { origin: "https://acheinovale.com" } } };
runInNewContext(source, context);
const shouldServeFromCache = context.shouldServeFromCache as (url: string, method: string, origin: string) => boolean;
const ORIGIN = "https://acheinovale.com";

describe("service worker do PWA", () => {
  it("guarda scripts e estilos com hash, que mudam de nome a cada deploy", () => {
    expect(shouldServeFromCache(`${ORIGIN}/_next/static/chunks/54eb6684e14a1356.css`, "GET", ORIGIN)).toBe(true);
    expect(shouldServeFromCache(`${ORIGIN}/_next/static/chunks/app/page-1a2b3c.js`, "GET", ORIGIN)).toBe(true);
  });

  it("nunca serve página do cache, para não mostrar versão antiga depois de um deploy", () => {
    expect(shouldServeFromCache(`${ORIGIN}/`, "GET", ORIGIN)).toBe(false);
    expect(shouldServeFromCache(`${ORIGIN}/privacidade`, "GET", ORIGIN)).toBe(false);
  });

  it("não prende arquivos sem hash, que podem ser trocados mantendo o nome", () => {
    expect(shouldServeFromCache(`${ORIGIN}/brand/logo-gold.png`, "GET", ORIGIN)).toBe(false);
    expect(shouldServeFromCache(`${ORIGIN}/_next/image?url=%2Ffoto.jpg&w=640&q=75`, "GET", ORIGIN)).toBe(false);
  });

  it("ignora outros sites e envios de formulário", () => {
    expect(shouldServeFromCache("https://cdn.exemplo.com/_next/static/a.js", "GET", ORIGIN)).toBe(false);
    expect(shouldServeFromCache(`${ORIGIN}/_next/static/a.js`, "POST", ORIGIN)).toBe(false);
  });
});
