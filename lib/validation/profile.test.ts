import { describe, expect, it } from "vitest";
import { formatBrazilianPhone, normalizeBrazilianPhone, safeInternalPath } from "./profile";

describe("WhatsApp do anunciante", () => {
  it("aceita celular e fixo com DDD, com ou sem +55 e máscara", () => {
    expect(normalizeBrazilianPhone("(47) 99778-5853")).toBe("5547997785853");
    expect(normalizeBrazilianPhone("+55 47 99778-5853")).toBe("5547997785853");
    expect(normalizeBrazilianPhone("47 3521-0000")).toBe("554735210000");
  });

  it("recusa número sem DDD ou com dígitos a mais", () => {
    expect(normalizeBrazilianPhone("99778-5853")).toBeNull();
    expect(normalizeBrazilianPhone("479977858531234")).toBeNull();
  });

  it("mostra o número salvo com máscara brasileira", () => {
    expect(formatBrazilianPhone("5547997785853")).toBe("(47) 99778-5853");
  });
});

describe("redirecionamento depois do login", () => {
  it("mantém caminhos do próprio site", () => {
    expect(safeInternalPath("/publicar/imovel?passo=2")).toBe("/publicar/imovel?passo=2");
  });

  it("não leva o usuário para outro site", () => {
    expect(safeInternalPath("https://site-falso.com/entrar")).toBe("/perfil");
    expect(safeInternalPath("//site-falso.com")).toBe("/perfil");
    expect(safeInternalPath("/\\site-falso.com")).toBe("/perfil");
    expect(safeInternalPath("/%5csite-falso.com")).toBe("/perfil");
  });

  it("usa o destino padrão quando não há caminho", () => {
    expect(safeInternalPath(undefined, "/meus-anuncios")).toBe("/meus-anuncios");
  });
});
