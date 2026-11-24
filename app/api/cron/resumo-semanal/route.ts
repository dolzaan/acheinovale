import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { absoluteUrl, isEmailConfigured, sendEmail } from "@/lib/email/mailer";
import {
  buildWeeklySummary,
  isSummaryDue,
  summaryItems,
  summaryParagraphs,
  summaryPeriod,
  summarySubject,
  type SummaryListing,
} from "@/lib/email/weekly-summary";
import { freighterUrl, propertyUrl } from "@/lib/listings/urls";
import { forEachWithConcurrency } from "@/lib/performance/concurrency";
import { isAuthorizedCronRequest } from "@/lib/security/cron";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_USERS_PER_RUN = 300;
const USER_CONCURRENCY = 3;
const TIME_BUDGET_MS = 45_000;

function sum(days: Array<{ views: number; whatsappClicks: number }>, key: "views" | "whatsappClicks") {
  return days.reduce((total, day) => total + day[key], 0);
}

// Toda segunda-feira: um e-mail por anunciante com visualizações e cliques no WhatsApp da semana.
export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  if (!isEmailConfigured()) return NextResponse.json({ skipped: "SMTP não configurado." });

  const now = new Date();
  const startedAt = Date.now();
  const { start, end } = summaryPeriod(now);
  const users = await prisma.user.findMany({
    where: {
      isBlocked: false,
      weeklySummaryOptOut: false,
      OR: [
        { properties: { some: { status: "ACTIVE" } } },
        { freighterProfile: { status: "ACTIVE" } },
      ],
    },
    select: { id: true, email: true, name: true, weeklySummarySentAt: true, summaryUnsubscribeToken: true },
    orderBy: { weeklySummarySentAt: { sort: "asc", nulls: "first" } },
    take: MAX_USERS_PER_RUN,
  });
  const dueUsers = users.filter(user => isSummaryDue(user.weeklySummarySentAt, now));

  let emails = 0;
  let processedUsers = 0;
  await forEachWithConcurrency(dueUsers, USER_CONCURRENCY, async user => {
    const periodMetrics = { where: { date: { gte: start, lt: end } }, select: { views: true, whatsappClicks: true } };
    const [properties, freighter] = await Promise.all([
      prisma.property.findMany({
        where: { ownerId: user.id, status: "ACTIVE" },
        select: { publicCode: true, slug: true, title: true, metrics: periodMetrics },
      }),
      prisma.freighterProfile.findFirst({
        where: { userId: user.id, status: "ACTIVE" },
        select: { publicCode: true, slug: true, displayName: true, metrics: periodMetrics },
      }),
    ]);
    const listings: SummaryListing[] = [
      ...properties.map(property => ({
        title: property.title,
        path: propertyUrl(property),
        views: sum(property.metrics, "views"),
        whatsappClicks: sum(property.metrics, "whatsappClicks"),
      })),
      ...(freighter ? [{
        title: `Frete: ${freighter.displayName}`,
        path: freighterUrl(freighter),
        views: sum(freighter.metrics, "views"),
        whatsappClicks: sum(freighter.metrics, "whatsappClicks"),
      }] : []),
    ];
    const summary = buildWeeklySummary(listings);
    if (!summary) {
      processedUsers += 1;
      return;
    }

    const token = user.summaryUnsubscribeToken ?? randomBytes(24).toString("base64url");
    if (!user.summaryUnsubscribeToken) {
      await prisma.user.update({ where: { id: user.id }, data: { summaryUnsubscribeToken: token } });
    }
    const sent = await sendEmail({
      to: user.email,
      subject: summarySubject(summary),
      paragraphs: summaryParagraphs(summary, user.name?.split(" ")[0] ?? null),
      items: summaryItems(summary),
      action: { label: "Abrir Meus anúncios", path: "/meus-anuncios" },
      footer: `Você recebe este resumo porque tem anúncios no Achei no Vale. Para não receber mais: ${absoluteUrl(`/resumo/cancelar?token=${token}`)}`,
    });
    if (sent) {
      await prisma.user.update({ where: { id: user.id }, data: { weeklySummarySentAt: now } });
      emails += 1;
    }
    processedUsers += 1;
  }, () => Date.now() - startedAt < TIME_BUDGET_MS);

  const pendingUsers = dueUsers.length - processedUsers;
  console.info(JSON.stringify({ level: "info", message: "weekly_summary_cron", candidates: dueUsers.length, emails, pendingUsers }));
  return NextResponse.json({ candidates: dueUsers.length, emails, pendingUsers });
}
