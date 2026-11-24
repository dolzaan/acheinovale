import { describe, expect, it } from "vitest";
import { advertiserDisplayName, advertiserUrl, normalizeCreci, profileSlugBase } from "./advertiser";

const agency = { name: "Maria Souza", advertiserKind: "AGENCY" as const, businessName: "Imobiliária Vale Verde", profileSlug: "imobiliaria-vale-verde" };

describe("perfil profissional do anunciante", () => {
  it("imobiliária aparece com o nome comercial e tem página pública", () => {
    expect(advertiserDisplayName(agency)).toBe("Imobiliária Vale Verde");
    expect(advertiserUrl(agency)).toBe("/anunciante/imobiliaria-vale-verde");
  });

  it("pessoa física aparece com o próprio nome e nunca tem página reunindo os anúncios", () => {
    const individual = { ...agency, advertiserKind: "INDIVIDUAL" as const };
    expect(advertiserDisplayName(individual)).toBe("Maria Souza");
    expect(advertiserUrl(individual)).toBeNull();
  });

  it("corretor sem nome comercial usa o nome da conta", () => {
    expect(advertiserDisplayName({ ...agency, advertiserKind: "BROKER", businessName: " " })).toBe("Maria Souza");
  });

  it("aceita CRECI nos formatos usados e recusa texto qualquer", () => {
    expect(normalizeCreci("12345-j")).toBe("12345-J");
    expect(normalizeCreci("SC 12345")).toBe("SC 12345");
    expect(normalizeCreci("")).toBeUndefined();
    expect(normalizeCreci("me liga")).toBeNull();
  });

  it("gera endereço de perfil sem acentos nem espaços", () => {
    expect(profileSlugBase("Imobiliária São João & Filhos")).toBe("imobiliaria-sao-joao-filhos");
    expect(profileSlugBase("!!!")).toBe("anunciante");
  });
});
