import type { PropertyPurpose, PropertyType } from "@prisma/client";

const DAY_MS = 24 * 60 * 60 * 1000;
// No máximo um aviso por imóvel a cada 7 dias, mesmo que o preço baixe várias vezes.
const NOTICE_INTERVAL_MS = 7 * DAY_MS;
// Queda maior que isso não é redução de preço: costuma ser erro de digitação ou troca de venda para aluguel.
const MAX_PLAUSIBLE_DROP = 0.7;
// Queda menor que 1% não vale um e-mail.
const MIN_RELEVANT_DROP = 0.01;

export function isRelevantPriceDrop(approvedPriceCents: number | null, newPriceCents: number) {
  if (approvedPriceCents === null || approvedPriceCents <= 0) return false;
  const drop = (approvedPriceCents - newPriceCents) / approvedPriceCents;
  return drop >= MIN_RELEVANT_DROP && drop <= MAX_PLAUSIBLE_DROP;
}

export function canSendPriceDropNotice(lastNoticeAt: Date | null, now = new Date()) {
  return !lastNoticeAt || now.getTime() - lastNoticeAt.getTime() >= NOTICE_INTERVAL_MS;
}

type AlertCriteria = {
  cityId: string | null;
  neighborhoodId: string | null;
  purpose: PropertyPurpose | null;
  type: PropertyType | null;
  minPriceCents: number | null;
  maxPriceCents: number | null;
  minBedrooms: number | null;
};

type PricedProperty = {
  cityId: string;
  neighborhoodId: string;
  purpose: PropertyPurpose;
  type: PropertyType;
  bedrooms: number | null;
  priceCents: number;
};

/**
 * O alerta só recebe o aviso se o imóvel ficou dentro do orçamento com a redução:
 * antes custava acima do valor máximo do alerta e agora cabe. Quem já via o imóvel
 * no alerta não precisa de outro e-mail.
 */
export function alertWelcomesPriceDrop(alert: AlertCriteria, property: PricedProperty, previousPriceCents: number) {
  if (alert.maxPriceCents === null) return false;
  if (previousPriceCents <= alert.maxPriceCents || property.priceCents > alert.maxPriceCents) return false;
  if (alert.minPriceCents !== null && property.priceCents < alert.minPriceCents) return false;
  if (alert.cityId && alert.cityId !== property.cityId) return false;
  if (alert.neighborhoodId && alert.neighborhoodId !== property.neighborhoodId) return false;
  if (alert.purpose && alert.purpose !== property.purpose) return false;
  if (alert.type && alert.type !== property.type) return false;
  if (alert.minBedrooms !== null && (property.bedrooms ?? -1) < alert.minBedrooms) return false;
  return true;
}
