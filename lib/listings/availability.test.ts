import { describe, expect, it } from "vitest";
import { availabilityDeadline, needsAvailabilityConfirmation, reminderIsDue } from "./availability";

const DAY = 24 * 60 * 60 * 1000;
const publishedAt = new Date("2026-09-01T12:00:00Z");
const property = { availabilityConfirmedAt: null, publishedAt, createdAt: new Date("2026-08-30T12:00:00Z") };

describe("confirmação de disponibilidade do imóvel", () => {
  it("pede confirmação 45 dias depois da publicação e pausa 15 dias depois disso", () => {
    const { askFrom, pauseAt } = availabilityDeadline(property);
    expect(askFrom).toEqual(new Date(publishedAt.getTime() + 45 * DAY));
    expect(pauseAt).toEqual(new Date(publishedAt.getTime() + 60 * DAY));
  });

  it("não incomoda o anunciante antes do prazo", () => {
    expect(needsAvailabilityConfirmation(property, new Date(publishedAt.getTime() + 44 * DAY))).toBe(false);
    expect(needsAvailabilityConfirmation(property, new Date(publishedAt.getTime() + 45 * DAY))).toBe(true);
  });

  it("uma confirmação recente reinicia a contagem", () => {
    const confirmed = { ...property, availabilityConfirmedAt: new Date(publishedAt.getTime() + 40 * DAY) };
    expect(needsAvailabilityConfirmation(confirmed, new Date(publishedAt.getTime() + 50 * DAY))).toBe(false);
  });

  it("manda um lembrete só depois de cada nova confirmação", () => {
    const remindedAfterPublish = { ...property, availabilityReminderSentAt: new Date(publishedAt.getTime() + 46 * DAY) };
    expect(reminderIsDue({ ...property, availabilityReminderSentAt: null })).toBe(true);
    expect(reminderIsDue(remindedAfterPublish)).toBe(false);
    expect(reminderIsDue({ ...remindedAfterPublish, availabilityConfirmedAt: new Date(publishedAt.getTime() + 50 * DAY) })).toBe(true);
  });
});
