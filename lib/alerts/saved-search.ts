import "server-only";

import type { Prisma, PropertyPurpose, PropertyType } from "@prisma/client";

export const MAX_ACTIVE_ALERTS_PER_USER = 10;

const typeLabels: Record<PropertyType, string> = {
  HOUSE: "Casa",
  APARTMENT: "Apartamento",
  STUDIO: "Kitnet / Studio",
  LAND: "Terreno",
  COMMERCIAL_ROOM: "Sala comercial",
  WAREHOUSE: "Galpão",
  OTHER: "Outro",
};

type AlertCriteria = {
  cityId: string | null;
  neighborhoodId: string | null;
  purpose: PropertyPurpose | null;
  type: PropertyType | null;
  minPriceCents: number | null;
  maxPriceCents: number | null;
  minBedrooms: number | null;
};

function money(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(cents / 100);
}

/** Descrição legível da busca salva, usada na página de alertas e nos e-mails. */
export function describeAlert(alert: AlertCriteria & { city?: { name: string } | null; neighborhood?: { name: string } | null }) {
  const parts = [
    alert.type ? typeLabels[alert.type] : "Imóveis",
    alert.purpose === "RENT" ? "para alugar" : alert.purpose === "SALE" ? "à venda" : null,
    alert.neighborhood ? `no bairro ${alert.neighborhood.name}` : null,
    alert.city ? `em ${alert.city.name}` : "em toda a região",
    alert.minBedrooms ? `com ${alert.minBedrooms}+ quartos` : null,
    alert.minPriceCents && alert.maxPriceCents
      ? `entre ${money(alert.minPriceCents)} e ${money(alert.maxPriceCents)}`
      : alert.minPriceCents ? `a partir de ${money(alert.minPriceCents)}`
        : alert.maxPriceCents ? `até ${money(alert.maxPriceCents)}` : null,
  ];
  return parts.filter(Boolean).join(" ");
}

/** Imóveis ativos compatíveis com o alerta e aprovados depois de `since`. */
export function alertMatchWhere(alert: AlertCriteria & { userId: string }, since: Date): Prisma.PropertyWhereInput {
  return {
    status: "ACTIVE",
    publishedAt: { gt: since },
    ownerId: { not: alert.userId },
    city: { isActive: true },
    ...(alert.cityId ? { cityId: alert.cityId } : {}),
    ...(alert.neighborhoodId ? { neighborhoodId: alert.neighborhoodId } : {}),
    ...(alert.purpose ? { purpose: alert.purpose } : {}),
    ...(alert.type ? { type: alert.type } : {}),
    ...(alert.minPriceCents !== null || alert.maxPriceCents !== null
      ? { priceCents: { ...(alert.minPriceCents !== null ? { gte: alert.minPriceCents } : {}), ...(alert.maxPriceCents !== null ? { lte: alert.maxPriceCents } : {}) } }
      : {}),
    ...(alert.minBedrooms !== null ? { bedrooms: { gte: alert.minBedrooms } } : {}),
  };
}
