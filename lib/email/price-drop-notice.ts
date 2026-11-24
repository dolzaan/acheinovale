import "server-only";

import { alertWelcomesPriceDrop } from "@/lib/alerts/price-drop";
import { describeAlert } from "@/lib/alerts/saved-search";
import { prisma } from "@/lib/db";
import { absoluteUrl, sendEmail } from "@/lib/email/mailer";
import { propertyUrl } from "@/lib/listings/urls";

function money(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(cents / 100);
}

type Recipient = { email: string; favorited: boolean; alertLinks: string[]; alertNames: string[] };

/** Avisa quem favoritou o imóvel e quem tem alerta em que ele passou a caber. Um e-mail por pessoa. */
export async function notifyPriceDrop(propertyId: string, previousPriceCents: number) {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: {
      id: true, ownerId: true, status: true, title: true, publicCode: true, slug: true,
      cityId: true, neighborhoodId: true, purpose: true, type: true, bedrooms: true, priceCents: true,
      city: { select: { name: true } }, neighborhood: { select: { name: true } },
    },
  });
  if (!property || property.status !== "ACTIVE" || property.priceCents >= previousPriceCents) return 0;

  const [favorites, alerts] = await Promise.all([
    prisma.favorite.findMany({
      where: { propertyId, userId: { not: property.ownerId }, user: { isBlocked: false } },
      select: { userId: true, user: { select: { email: true } } },
    }),
    prisma.savedSearch.findMany({
      where: {
        isActive: true,
        userId: { not: property.ownerId },
        user: { isBlocked: false },
        maxPriceCents: { gte: property.priceCents, lt: previousPriceCents },
      },
      include: { user: { select: { email: true } }, city: { select: { name: true } }, neighborhood: { select: { name: true } } },
    }),
  ]);

  const recipients = new Map<string, Recipient>();
  for (const favorite of favorites) {
    recipients.set(favorite.userId, { email: favorite.user.email, favorited: true, alertLinks: [], alertNames: [] });
  }
  for (const alert of alerts) {
    if (!alertWelcomesPriceDrop(alert, property, previousPriceCents)) continue;
    const recipient = recipients.get(alert.userId) ?? { email: alert.user.email, favorited: false, alertLinks: [], alertNames: [] };
    recipient.alertLinks.push(absoluteUrl(`/alertas/cancelar?token=${alert.unsubscribeToken}`));
    recipient.alertNames.push(describeAlert(alert));
    recipients.set(alert.userId, recipient);
  }

  const path = propertyUrl(property);
  let sent = 0;
  for (const recipient of recipients.values()) {
    const reason = recipient.favorited
      ? "Você recebe este aviso porque salvou este imóvel nos favoritos."
      : `Você recebe este aviso porque o imóvel agora cabe no seu alerta (${recipient.alertNames.join("; ")}). Para cancelar o alerta: ${recipient.alertLinks.join(" ")}`;
    const ok = await sendEmail({
      to: recipient.email,
      subject: `Baixou o preço: ${property.title}`,
      paragraphs: [
        `O imóvel "${property.title}" baixou de ${money(previousPriceCents)} para ${money(property.priceCents)}${property.purpose === "RENT" ? " por mês" : ""}.`,
        "Se ainda tiver interesse, fale direto com o anunciante pelo WhatsApp no anúncio.",
      ],
      items: [{ title: property.title, detail: `${money(property.priceCents)} · ${property.neighborhood.name}, ${property.city.name}`, path }],
      action: { label: "Ver o imóvel", path },
      footer: reason,
    });
    if (ok) sent += 1;
  }
  return sent;
}
