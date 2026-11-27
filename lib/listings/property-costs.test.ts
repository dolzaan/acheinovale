import { describe, expect, it } from "vitest";
import { feePeriodFormValue, parseFeePeriod, parseOptionalFee, parseUtility, propertyCostLines } from "./property-costs";

const empty = {
  condoFeeCents: null, iptuCents: null, garbageFeeCents: null,
  condoFeePeriod: null, iptuPeriod: null, garbageFeePeriod: null,
  waterIncluded: null, electricityIncluded: null, internetIncluded: null,
};

describe("custos opcionais do imóvel", () => {
  it("entende valores escritos no formato brasileiro", () => {
    expect(parseOptionalFee("450,00")).toEqual({ valid: true, value: 45000 });
    expect(parseOptionalFee("1.234,56")).toEqual({ valid: true, value: 123456 });
    expect(parseOptionalFee("R$ 380")).toEqual({ valid: true, value: 38000 });
  });

  it("vazio fica como não informado e zero como isento", () => {
    expect(parseOptionalFee("")).toEqual({ valid: true, value: null });
    expect(parseOptionalFee("0,00")).toEqual({ valid: true, value: 0 });
  });

  it("recusa texto e valores absurdos", () => {
    expect(parseOptionalFee("barato").valid).toBe(false);
    expect(parseOptionalFee("-50").valid).toBe(false);
    expect(parseOptionalFee("999.999,00").valid).toBe(false);
  });

  it("quem paga as contas só aceita as opções do formulário", () => {
    expect(parseUtility("incluso")).toEqual({ valid: true, value: true });
    expect(parseUtility("inquilino")).toEqual({ valid: true, value: false });
    expect(parseUtility("")).toEqual({ valid: true, value: null });
    expect(parseUtility("talvez").valid).toBe(false);
  });

  it("o anunciante escolhe se cada custo é por mês ou por ano", () => {
    expect(parseFeePeriod("mes", "YEAR")).toEqual({ valid: true, value: "MONTH" });
    expect(parseFeePeriod("ano", "MONTH")).toEqual({ valid: true, value: "YEAR" });
    expect(parseFeePeriod("semana", "MONTH").valid).toBe(false);
  });

  it("mostra o valor com o período escolhido", () => {
    expect(propertyCostLines({ ...empty, purpose: "RENT", iptuCents: 9000, iptuPeriod: "MONTH", condoFeeCents: 540000, condoFeePeriod: "YEAR" })).toEqual([
      { label: "Condomínio", value: "R$ 5.400/ano" },
      { label: "IPTU", value: "R$ 90/mês" },
    ]);
  });

  it("anúncio antigo, sem período salvo, usa o período mais comum de cada custo", () => {
    expect(propertyCostLines({ ...empty, purpose: "SALE", condoFeeCents: 45000, iptuCents: 120050 })).toEqual([
      { label: "Condomínio", value: "R$ 450/mês" },
      { label: "IPTU", value: "R$ 1.200,50/ano" },
    ]);
    expect(feePeriodFormValue(null, "YEAR")).toBe("ano");
  });

  it("mostra isento e quem paga as contas no aluguel", () => {
    expect(propertyCostLines({ ...empty, purpose: "RENT", garbageFeeCents: 0, waterIncluded: true, internetIncluded: false })).toEqual([
      { label: "Taxa de lixo", value: "isenta" },
      { label: "Água", value: "inclusa no aluguel" },
      { label: "Internet", value: "por conta do inquilino" },
    ]);
  });

  it("em imóvel à venda não fala de contas do inquilino", () => {
    expect(propertyCostLines({ ...empty, purpose: "SALE", waterIncluded: false })).toEqual([]);
  });
});
