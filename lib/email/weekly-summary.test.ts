import { describe, expect, it } from "vitest";
import { buildWeeklySummary, isSummaryDue, summaryItems, summaryParagraphs, summaryPeriod, summarySubject } from "./weekly-summary";

const casa = { title: "Casa no Centro", path: "/imovel/a1/casa", views: 12, whatsappClicks: 1 };
const apartamento = { title: "Apartamento no Canta Galo", path: "/imovel/b2/apto", views: 40, whatsappClicks: 3 };

describe("resumo semanal do anunciante", () => {
  it("soma a semana e mostra primeiro o anúncio mais visto", () => {
    const summary = buildWeeklySummary([casa, apartamento]);
    expect(summary).toMatchObject({ views: 52, whatsappClicks: 4 });
    expect(summary?.listings.map(listing => listing.title)).toEqual(["Apartamento no Canta Galo", "Casa no Centro"]);
  });

  it("não manda e-mail numa semana sem nenhuma visualização", () => {
    expect(buildWeeklySummary([{ ...casa, views: 0, whatsappClicks: 0 }])).toBeNull();
    expect(buildWeeklySummary([])).toBeNull();
  });

  it("escreve o assunto com singular e plural certos", () => {
    expect(summarySubject({ views: 1, whatsappClicks: 1, listings: [] })).toBe("Sua semana no Achei no Vale: 1 visualização e 1 contato");
    expect(summarySubject({ views: 1200, whatsappClicks: 0, listings: [] })).toBe("Sua semana no Achei no Vale: 1.200 visualizações e 0 contatos");
  });

  it("dá uma dica quando ninguém chamou no WhatsApp", () => {
    const paragraphs = summaryParagraphs({ views: 10, whatsappClicks: 0, listings: [] }, "Ana");
    expect(paragraphs[0]).toBe("Olá, Ana!");
    expect(paragraphs[2]).toContain("Fotos claras");
  });

  it("lista cada anúncio com o link para ele", () => {
    const summary = buildWeeklySummary([casa])!;
    expect(summaryItems(summary)).toEqual([{ title: "Casa no Centro", detail: "12 visualizações · 1 contato no WhatsApp", path: "/imovel/a1/casa" }]);
  });

  it("mede os 7 dias completos antes do envio, sem o dia corrente", () => {
    const { start, end } = summaryPeriod(new Date("2026-11-30T12:00:00Z"));
    expect(start.toISOString()).toBe("2026-11-23T00:00:00.000Z");
    expect(end.toISOString()).toBe("2026-11-30T00:00:00.000Z");
  });

  it("não envia dois resumos na mesma semana", () => {
    const now = new Date("2026-11-30T12:00:00Z");
    expect(isSummaryDue(null, now)).toBe(true);
    expect(isSummaryDue(new Date("2026-11-27T12:00:00Z"), now)).toBe(false);
    expect(isSummaryDue(new Date("2026-11-23T12:00:00Z"), now)).toBe(true);
  });
});
