import { describe, expect, it } from "vitest";
import { parseOptionalFee, parseUtility, propertyCostLines } from "./property-costs";

const empty = { condoFeeCents: null, iptuCents: null, garbageFeeCents: null, waterIncluded: null, electricityIncluded: null, internetIncluded: null };

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

  it("mostra só o que foi informado, com período e quem paga", () => {
    expect(propertyCostLines({ ...empty, purpose: "RENT", condoFeeCents: 45000, iptuCents: 0, waterIncluded: true, internetIncluded: false })).toEqual([
      { label: "Condomínio", value: "R$ 450/mês" },
      { label: "IPTU", value: "isento" },
      { label: "Água", value: "inclusa no aluguel" },
      { label: "Internet", value: "por conta do inquilino" },
    ]);
  });

  it("em imóvel à venda não fala de contas do inquilino", () => {
    expect(propertyCostLines({ ...empty, purpose: "SALE", iptuCents: 120050, waterIncluded: false })).toEqual([
      { label: "IPTU", value: "R$ 1.200,50/ano" },
    ]);
  });

  it("sem nada informado, a seção não aparece", () => {
    expect(propertyCostLines({ ...empty, purpose: "RENT" })).toEqual([]);
  });
});
