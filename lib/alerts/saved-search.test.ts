import { describe, expect, it } from "vitest";
import { alertMatchWhere, describeAlert } from "./saved-search";

const emptyAlert = {
  cityId: null,
  neighborhoodId: null,
  purpose: null,
  type: null,
  minPriceCents: null,
  maxPriceCents: null,
  minBedrooms: null,
};

// O Intl coloca um espaço inquebrável depois de "R$"; para quem lê, é o mesmo texto.
const NO_BREAK_SPACE = String.fromCharCode(160);

describe("alertas de imóveis", () => {
  it("descreve o alerta em português para a página e o e-mail", () => {
    const description = describeAlert({
      ...emptyAlert,
      type: "APARTMENT",
      purpose: "RENT",
      city: { name: "Rio do Sul" },
      neighborhood: { name: "Centro" },
      minBedrooms: 2,
      maxPriceCents: 200_000,
    });
    expect(description.replaceAll(NO_BREAK_SPACE, " ")).toBe("Apartamento para alugar no bairro Centro em Rio do Sul com 2+ quartos até R$ 2.000");
  });

  it("alerta sem cidade vale para toda a região", () => {
    expect(describeAlert(emptyAlert)).toBe("Imóveis em toda a região");
  });

  it("só considera imóveis ativos, publicados depois do último envio e de outros anunciantes", () => {
    const since = new Date("2026-11-01T00:00:00Z");
    const where = alertMatchWhere({ ...emptyAlert, userId: "dono-do-alerta" }, since);
    expect(where).toMatchObject({
      status: "ACTIVE",
      publishedAt: { gt: since },
      ownerId: { not: "dono-do-alerta" },
      city: { isActive: true },
    });
  });

  it("aplica a faixa de preço e os quartos do alerta", () => {
    const where = alertMatchWhere({ ...emptyAlert, userId: "u", minPriceCents: 100_000, maxPriceCents: 300_000, minBedrooms: 3 }, new Date());
    expect(where.priceCents).toEqual({ gte: 100_000, lte: 300_000 });
    expect(where.bedrooms).toEqual({ gte: 3 });
  });
});
