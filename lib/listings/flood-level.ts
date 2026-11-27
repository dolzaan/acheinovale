// Cota de enchente: nível do rio (em metros) a partir do qual a água chega ao imóvel.
// Guardada em centímetros para não depender de decimais no banco.
export const FLOOD_LEVEL_MIN_CM = 100;
export const FLOOD_LEVEL_MAX_CM = 3000;

/** Aceita "12", "12,5", "12.50" ou "12,5 m". Vazio é válido (campo opcional). */
export function parseFloodLevel(raw: string): { valid: boolean; value: number | null } {
  const text = raw.trim().toLowerCase().replace(/\s*m$/, "").replace(",", ".");
  if (!text) return { valid: true, value: null };
  if (!/^\d{1,2}(\.\d{1,2})?$/.test(text)) return { valid: false, value: null };
  const centimeters = Math.round(Number(text) * 100);
  return centimeters >= FLOOD_LEVEL_MIN_CM && centimeters <= FLOOD_LEVEL_MAX_CM
    ? { valid: true, value: centimeters }
    : { valid: false, value: null };
}

/** 1250 → "12,5 m"; 1300 → "13 m". */
export function formatFloodLevel(centimeters: number) {
  return `${(centimeters / 100).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} m`;
}

/** Valor para preencher o campo do formulário: 1250 → "12,5". */
export function floodLevelInputValue(centimeters: number | null) {
  return centimeters === null ? "" : (centimeters / 100).toLocaleString("pt-BR", { maximumFractionDigits: 2, useGrouping: false });
}
