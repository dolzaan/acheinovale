import type { Prisma } from "@prisma/client";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Dias após a última confirmação em que pedimos ao anunciante para confirmar a disponibilidade. */
export const AVAILABILITY_CONFIRM_AFTER_DAYS = 45;
/** Dias extras sem confirmação até a pausa automática. */
export const AVAILABILITY_GRACE_DAYS = 15;

export const AUTO_PAUSE_NOTE = "Pausado automaticamente por falta de confirmação de disponibilidade. Se o imóvel ainda estiver disponível, reative o anúncio.";

type AvailabilityDates = {
  availabilityConfirmedAt: Date | null;
  publishedAt: Date | null;
  createdAt: Date;
};

function lastConfirmation(property: AvailabilityDates) {
  return property.availabilityConfirmedAt ?? property.publishedAt ?? property.createdAt;
}

export function availabilityDeadline(property: AvailabilityDates) {
  const askFrom = new Date(lastConfirmation(property).getTime() + AVAILABILITY_CONFIRM_AFTER_DAYS * DAY_MS);
  const pauseAt = new Date(askFrom.getTime() + AVAILABILITY_GRACE_DAYS * DAY_MS);
  return { askFrom, pauseAt };
}

export function needsAvailabilityConfirmation(property: AvailabilityDates, now = new Date()) {
  return availabilityDeadline(property).askFrom <= now;
}

/** Imóveis ativos cuja última confirmação ultrapassou o prazo total (aviso + tolerância). */
export function expiredAvailabilityWhere(now = new Date()): Prisma.PropertyWhereInput {
  const cutoff = new Date(now.getTime() - (AVAILABILITY_CONFIRM_AFTER_DAYS + AVAILABILITY_GRACE_DAYS) * DAY_MS);
  return {
    status: "ACTIVE",
    OR: [
      { availabilityConfirmedAt: { lt: cutoff } },
      { availabilityConfirmedAt: null, publishedAt: { lt: cutoff } },
      { availabilityConfirmedAt: null, publishedAt: null, createdAt: { lt: cutoff } },
    ],
  };
}
