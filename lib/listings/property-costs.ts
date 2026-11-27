// Custos e contas opcionais do imóvel: IPTU e taxa de lixo (por ano), condomínio (por mês)
// e quem paga água, luz e internet (só para aluguel).

export const MAX_FEE_CENTS = 10_000_000; // R$ 100.000

export type UtilityKey = "waterIncluded" | "electricityIncluded" | "internetIncluded";

export const UTILITIES: ReadonlyArray<{ key: UtilityKey; field: string; label: string }> = [
  { key: "waterIncluded", field: "water", label: "Água" },
  { key: "electricityIncluded", field: "electricity", label: "Luz" },
  { key: "internetIncluded", field: "internet", label: "Internet" },
];

/** Valor do formulário ("1.234,56") em centavos. Vazio é válido; zero também (isento). */
export function parseOptionalFee(raw: string): { valid: boolean; value: number | null } {
  const text = raw.replace(/\s/g, "").replace(/^R\$/i, "");
  if (!text) return { valid: true, value: null };
  if (!/^\d{1,3}(\.?\d{3})*(,\d{1,2})?$/.test(text)) return { valid: false, value: null };
  const cents = Math.round(Number(text.replace(/\./g, "").replace(",", ".")) * 100);
  return Number.isSafeInteger(cents) && cents >= 0 && cents <= MAX_FEE_CENTS
    ? { valid: true, value: cents }
    : { valid: false, value: null };
}

/** "incluso" → true, "inquilino" → false, vazio → não informado. */
export function parseUtility(raw: string): { valid: boolean; value: boolean | null } {
  if (!raw) return { valid: true, value: null };
  if (raw === "incluso") return { valid: true, value: true };
  if (raw === "inquilino") return { valid: true, value: false };
  return { valid: false, value: null };
}

export function utilityFormValue(value: boolean | null) {
  return value === null ? "" : value ? "incluso" : "inquilino";
}

const brl = (cents: number) =>
  cents === 0 ? "isento" : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100).replace(/\s/g, " ");

type CostSource = {
  purpose: "RENT" | "SALE";
  condoFeeCents: number | null;
  iptuCents: number | null;
  garbageFeeCents: number | null;
  waterIncluded: boolean | null;
  electricityIncluded: boolean | null;
  internetIncluded: boolean | null;
};

/** Linhas da seção "Custos e contas" da página do anúncio; vazia quando nada foi informado. */
export function propertyCostLines(property: CostSource) {
  const lines: Array<{ label: string; value: string }> = [];
  if (property.condoFeeCents !== null) lines.push({ label: "Condomínio", value: property.condoFeeCents ? `${brl(property.condoFeeCents)}/mês` : "isento" });
  if (property.iptuCents !== null) lines.push({ label: "IPTU", value: property.iptuCents ? `${brl(property.iptuCents)}/ano` : "isento" });
  if (property.garbageFeeCents !== null) lines.push({ label: "Taxa de lixo", value: property.garbageFeeCents ? `${brl(property.garbageFeeCents)}/ano` : "isenta" });
  if (property.purpose === "RENT") {
    for (const utility of UTILITIES) {
      const included = property[utility.key];
      if (included !== null) lines.push({ label: utility.label, value: included ? "inclusa no aluguel" : "por conta do inquilino" });
    }
  }
  return lines;
}
