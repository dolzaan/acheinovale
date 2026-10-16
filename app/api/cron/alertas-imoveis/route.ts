import { NextResponse } from "next/server";
import { alertMatchWhere, describeAlert } from "@/lib/alerts/saved-search";
import { prisma } from "@/lib/db";
import { absoluteUrl, isEmailConfigured, sendEmail } from "@/lib/email/mailer";
import { propertyUrl } from "@/lib/listings/urls";
import { isAuthorizedCronRequest } from "@/lib/security/cron";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_ALERTS_PER_RUN = 500;
const MAX_PROPERTIES_PER_ALERT = 10;

function money(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(cents / 100);
}

// Resumo diário: um e-mail por usuário com os imóveis aprovados desde o último envio de cada alerta.
export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  if (!isEmailConfigured()) return NextResponse.json({ skipped: "SMTP não configurado." });

  const now = new Date();
  const alerts = await prisma.savedSearch.findMany({
    where: { isActive: true, user: { isBlocked: false } },
    include: { user: { select: { email: true } }, city: { select: { name: true } }, neighborhood: { select: { name: true } } },
    orderBy: { lastNotifiedAt: { sort: "asc", nulls: "first" } },
    take: MAX_ALERTS_PER_RUN,
  });

  const byUser = new Map<string, typeof alerts>();
  for (const alert of alerts) byUser.set(alert.userId, [...(byUser.get(alert.userId) ?? []), alert]);

  let emails = 0;
  for (const userAlerts of byUser.values()) {
    const sections = [];
    for (const alert of userAlerts) {
      const properties = await prisma.property.findMany({
        where: alertMatchWhere(alert, alert.lastNotifiedAt ?? alert.createdAt),
        include: { city: { select: { name: true } }, neighborhood: { select: { name: true } } },
        orderBy: { publishedAt: "desc" },
        take: MAX_PROPERTIES_PER_ALERT,
      });
      sections.push({ alert, properties });
    }

    const withResults = sections.filter(section => section.properties.length);
    const sent = !withResults.length || await sendEmail({
      to: userAlerts[0].user.email,
      subject: withResults.length === 1
        ? `Novos imóveis: ${describeAlert(withResults[0].alert)}`
        : `Novos imóveis para ${withResults.length} dos seus alertas`,
      paragraphs: [
        "Encontramos imóveis novos no Achei no Vale que combinam com suas buscas.",
        ...withResults.map(section => `${describeAlert(section.alert)}: ${section.properties.length} ${section.properties.length === 1 ? "novo imóvel" : "novos imóveis"}.`),
      ],
      items: withResults.flatMap(section => section.properties.map(property => ({
        title: property.title,
        detail: `${property.purpose === "RENT" ? "Aluguel" : "Venda"} · ${money(property.priceCents)} · ${property.neighborhood.name}, ${property.city.name}`,
        path: propertyUrl(property),
      }))),
      action: { label: "Gerenciar meus alertas", path: "/alertas" },
      footer: `Você recebe este e-mail porque criou alertas no Achei no Vale. Para cancelar um alerta: ${withResults.map(section => absoluteUrl(`/alertas/cancelar?token=${section.alert.unsubscribeToken}`)).join(" ")}`,
    });

    if (sent) {
      // Marca todos os alertas do usuário: os sem resultado também não têm nada pendente até agora.
      await prisma.savedSearch.updateMany({ where: { id: { in: userAlerts.map(alert => alert.id) } }, data: { lastNotifiedAt: now } });
      if (withResults.length) emails += 1;
    }
  }

  console.info(JSON.stringify({ level: "info", message: "property_alerts_cron", alerts: alerts.length, emails }));
  return NextResponse.json({ alerts: alerts.length, emails });
}
