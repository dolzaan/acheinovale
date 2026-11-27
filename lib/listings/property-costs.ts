// Custos e contas opcionais do imóvel: condomínio, IPTU e taxa de lixo (o anunciante escolhe
// se o valor é por mês ou por ano) e quem paga água, luz e internet (só para aluguel).

export const MAX_FEE_CENTS = 10_000_000; // R$ 100.000

export type FeePeriod = "MONTH" | "YEAR";
export type FeeKey = "condoFeeCents" | "iptuCents" | "garbageFeeCents";
export type FeePeriodKey = "condoFeePeriod" | "iptuPeriod" | "garbageFeePeriod";
export type UtilityKey = "waterIncluded" | "electricityIncluded" | "internetIncluded";

export const FEES: ReadonlyArray<{
  key: FeeKey;
  periodKey: FeePeriodKey;
  field: string;
  periodField: string;
  label: string;
  /** Período mais comum: sugerido no formulário e usado em anúncios antigos sem período salvo. */
  defaultPeriod: FeePeriod;
  exemptLabel: string;
}> = [
  { key: "condoFeeCents", periodKey: "condoFeePeriod", field: "condoFee", periodField: "condoFeePeriod", label: "Condomínio", defaultPeriod: "MONTH", exemptLabel: "isento" },
  { key: "iptuCents", periodKey: "iptuPeriod", field: "iptu", periodField: "iptuPeriod", label: "IPTU", defaultPeriod: "YEAR", exemptLabel: "isento" },
  { key: "garbageFeeCents", periodKey: "garbageFeePeriod", field: "garbageFee", periodField: "garbageFeePeriod", label: "Taxa de lixo", defaultPeriod: "YEAR", exemptLabel: "isenta" },
];

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

/** "mes" → MONTH, "ano" → YEAR; vazio usa o período padrão daquele custo. */
export function parseFeePeriod(raw: string, fallback: FeePeriod): { valid: boolean; value: FeePeriod } {
  if (!raw) return { valid: true, value: fallback };
  if (raw === "mes") return { valid: true, value: "MONTH" };
  if (raw === "ano") return { valid: true, value: "YEAR" };
  return { valid: false, value: fallback };
}

function resolvePeriod(period: string | null | undefined, fallback: FeePeriod): FeePeriod {
  return period === "MONTH" || period === "YEAR" ? period : fallback;
}

export function feePeriodFormValue(period: string | null | undefined, fallback: FeePeriod) {
  return resolvePeriod(period, fallback) === "MONTH" ? "mes" : "ano";
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

function brl(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: cents % 100 ? 2 : 0 })
    .format(cents / 100)
    .replace(/\s/g, " ");
}

type CostSource = { purpose: "RENT" | "SALE" }
  & Record<FeeKey, number | null>
  & Record<FeePeriodKey, string | null>
  & Record<UtilityKey, boolean | null>;

/** Linhas da seção "Custos e contas" da página do anúncio; vazia quando nada foi informado. */
export function propertyCostLines(property: CostSource) {
  const lines: Array<{ label: string; value: string }> = [];
  for (const fee of FEES) {
    const cents = property[fee.key];
    if (cents === null) continue;
    const period = resolvePeriod(property[fee.periodKey], fee.defaultPeriod);
    lines.push({ label: fee.label, value: cents === 0 ? fee.exemptLabel : `${brl(cents)}/${period === "MONTH" ? "mês" : "ano"}` });
  }
  if (property.purpose === "RENT") {
    for (const utility of UTILITIES) {
      const included = property[utility.key];
      if (included !== null) lines.push({ label: utility.label, value: included ? "inclusa no aluguel" : "por conta do inquilino" });
    }
  }
  return lines;
}
