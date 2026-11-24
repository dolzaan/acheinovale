export const SUMMARY_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;
// Não manda dois resumos na mesma semana, mesmo que o cron rode de novo.
const MIN_INTERVAL_MS = 6 * DAY_MS;

export type SummaryListing = { title: string; path: string; views: number; whatsappClicks: number };

export type WeeklySummary = {
  views: number;
  whatsappClicks: number;
  listings: SummaryListing[];
};

/** Intervalo de dias completos medido: os 7 dias antes de hoje (UTC), sem o dia corrente. */
export function summaryPeriod(now = new Date()) {
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const start = new Date(end.getTime() - SUMMARY_DAYS * DAY_MS);
  return { start, end };
}

export function isSummaryDue(lastSentAt: Date | null, now = new Date()) {
  return !lastSentAt || now.getTime() - lastSentAt.getTime() >= MIN_INTERVAL_MS;
}

/**
 * Junta os números da semana. Sem nenhuma visualização, não há resumo: um e-mail
 * dizendo "0 visualizações" não ajuda o anunciante.
 */
export function buildWeeklySummary(listings: SummaryListing[]): WeeklySummary | null {
  const views = listings.reduce((total, listing) => total + listing.views, 0);
  const whatsappClicks = listings.reduce((total, listing) => total + listing.whatsappClicks, 0);
  if (views === 0) return null;
  const ordered = [...listings].sort((first, second) => second.views - first.views || second.whatsappClicks - first.whatsappClicks);
  return { views, whatsappClicks, listings: ordered };
}

function plural(count: number, singular: string, pluralForm: string) {
  return `${new Intl.NumberFormat("pt-BR").format(count)} ${count === 1 ? singular : pluralForm}`;
}

export function summarySubject(summary: WeeklySummary) {
  return `Sua semana no Achei no Vale: ${plural(summary.views, "visualização", "visualizações")} e ${plural(summary.whatsappClicks, "contato", "contatos")}`;
}

export function summaryParagraphs(summary: WeeklySummary, firstName: string | null) {
  return [
    `Olá${firstName ? `, ${firstName}` : ""}!`,
    `Nos últimos ${SUMMARY_DAYS} dias, seus anúncios tiveram ${plural(summary.views, "visualização", "visualizações")} e ${plural(summary.whatsappClicks, "clique", "cliques")} no WhatsApp.`,
    summary.whatsappClicks === 0
      ? "Ninguém chamou no WhatsApp ainda. Fotos claras, preço e uma descrição com o que o imóvel tem de melhor costumam fazer diferença."
      : "Confira abaixo o desempenho de cada anúncio.",
  ];
}

export function summaryItems(summary: WeeklySummary) {
  return summary.listings.map(listing => ({
    title: listing.title,
    detail: `${plural(listing.views, "visualização", "visualizações")} · ${plural(listing.whatsappClicks, "contato", "contatos")} no WhatsApp`,
    path: listing.path,
  }));
}
