import { describe, expect, it } from "vitest";
import { alertWelcomesPriceDrop, canSendPriceDropNotice, isRelevantPriceDrop } from "./price-drop";

const casa = {
  cityId: "rio-do-sul",
  neighborhoodId: "centro",
  purpose: "RENT" as const,
  type: "HOUSE" as const,
  bedrooms: 3,
  priceCents: 180_000,
};
const alertaAte2000 = {
  cityId: "rio-do-sul",
  neighborhoodId: null,
  purpose: "RENT" as const,
  type: "HOUSE" as const,
  minPriceCents: null,
  maxPriceCents: 200_000,
  minBedrooms: 2,
};

describe("quando uma queda de preço vale aviso", () => {
  it("avisa quando o preço aprovado baixa de verdade", () => {
    expect(isRelevantPriceDrop(220_000, 180_000)).toBe(true);
  });

  it("não avisa anúncio novo, aumento de preço ou queda de centavos", () => {
    expect(isRelevantPriceDrop(null, 180_000)).toBe(false);
    expect(isRelevantPriceDrop(180_000, 190_000)).toBe(false);
    expect(isRelevantPriceDrop(200_000, 199_500)).toBe(false);
  });

  it("não trata como redução uma queda absurda, que costuma ser erro de digitação", () => {
    expect(isRelevantPriceDrop(45_000_000, 250_000)).toBe(false);
  });

  it("manda no máximo um aviso por imóvel a cada 7 dias", () => {
    const now = new Date("2026-11-24T12:00:00Z");
    expect(canSendPriceDropNotice(null, now)).toBe(true);
    expect(canSendPriceDropNotice(new Date("2026-11-20T12:00:00Z"), now)).toBe(false);
    expect(canSendPriceDropNotice(new Date("2026-11-17T12:00:00Z"), now)).toBe(true);
  });
});

describe("quais alertas recebem o aviso de redução", () => {
  it("avisa o alerta em que o imóvel passou a caber no orçamento", () => {
    expect(alertWelcomesPriceDrop(alertaAte2000, casa, 220_000)).toBe(true);
  });

  it("não repete o aviso para quem já via o imóvel no alerta", () => {
    expect(alertWelcomesPriceDrop(alertaAte2000, casa, 195_000)).toBe(false);
  });

  it("não avisa se, mesmo com a redução, o imóvel continua acima do orçamento", () => {
    expect(alertWelcomesPriceDrop({ ...alertaAte2000, maxPriceCents: 150_000 }, casa, 220_000)).toBe(false);
  });

  it("respeita cidade, bairro, finalidade, tipo e quartos do alerta", () => {
    expect(alertWelcomesPriceDrop({ ...alertaAte2000, cityId: "ibirama" }, casa, 220_000)).toBe(false);
    expect(alertWelcomesPriceDrop({ ...alertaAte2000, neighborhoodId: "barragem" }, casa, 220_000)).toBe(false);
    expect(alertWelcomesPriceDrop({ ...alertaAte2000, purpose: "SALE" }, casa, 220_000)).toBe(false);
    expect(alertWelcomesPriceDrop({ ...alertaAte2000, type: "APARTMENT" }, casa, 220_000)).toBe(false);
    expect(alertWelcomesPriceDrop({ ...alertaAte2000, minBedrooms: 4 }, casa, 220_000)).toBe(false);
  });

  it("alerta sem valor máximo não recebe aviso de preço", () => {
    expect(alertWelcomesPriceDrop({ ...alertaAte2000, maxPriceCents: null }, casa, 220_000)).toBe(false);
  });
});
