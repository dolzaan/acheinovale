import { describe, expect, it } from "vitest";
import { moderationPublishedAt, ownerCanReactivate, ownerCanTogglePause } from "./owner-status";

const published = new Date("2026-11-01T12:00:00Z");

describe("pausa da moderação", () => {
  it("o dono não consegue reativar um anúncio pausado pela moderação", () => {
    const afterModerationPause = { status: "PAUSED", publishedAt: moderationPublishedAt("pause", published) };
    expect(ownerCanReactivate(afterModerationPause)).toBe(false);
    expect(ownerCanTogglePause(afterModerationPause)).toBe(false);
  });

  it("o dono reativa o que ele mesmo pausou", () => {
    expect(ownerCanReactivate({ status: "PAUSED", publishedAt: published })).toBe(true);
  });

  it("aprovar de novo devolve a data de publicação", () => {
    const now = new Date("2026-11-27T12:00:00Z");
    expect(moderationPublishedAt("approve", null, now)).toEqual(now);
    expect(moderationPublishedAt("approve", published, now)).toEqual(published);
  });

  it("rejeitar não mexe na data de publicação", () => {
    expect(moderationPublishedAt("reject", published)).toEqual(published);
  });
});
