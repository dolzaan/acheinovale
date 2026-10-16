import "server-only";

import { after } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email/mailer";

/** Envia depois que a resposta foi entregue, sem atrasar a ação do usuário. */
export function sendLater(task: () => Promise<unknown>) {
  after(async () => {
    try {
      await task();
    } catch (error) {
      console.error(JSON.stringify({ level: "error", message: "deferred_email_failed", error: error instanceof Error ? error.message : String(error) }));
    }
  });
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "America/Sao_Paulo" }).format(value);
}

type ListingKind = "imovel" | "freteiro";
const kindLabel: Record<ListingKind, string> = { imovel: "anúncio", freteiro: "perfil de freteiro" };

export async function notifyModerationDecision(params: {
  to: string;
  name: string | null;
  kind: ListingKind;
  title: string;
  intent: "approve" | "reject" | "pause";
  note: string | null;
  path: string;
}) {
  const greeting = `Olá${params.name ? `, ${params.name.split(" ")[0]}` : ""}!`;
  const label = kindLabel[params.kind];
  if (params.intent === "approve") {
    return sendEmail({
      to: params.to,
      subject: `Seu ${label} foi aprovado: ${params.title}`,
      paragraphs: [greeting, `Seu ${label} "${params.title}" foi aprovado e já está visível no Achei no Vale.`],
      action: { label: "Ver publicação", path: params.path },
    });
  }
  return sendEmail({
    to: params.to,
    subject: params.intent === "reject" ? `Seu ${label} precisa de ajustes: ${params.title}` : `Seu ${label} foi pausado: ${params.title}`,
    paragraphs: [
      greeting,
      params.intent === "reject"
        ? `Seu ${label} "${params.title}" não foi aprovado pela moderação.`
        : `Seu ${label} "${params.title}" foi pausado pela moderação.`,
      ...(params.note ? [`Orientação: ${params.note}`] : []),
      "Você pode revisar e reenviar pela área Meus anúncios.",
    ],
    action: { label: "Abrir Meus anúncios", path: "/meus-anuncios" },
  });
}

export async function notifyAdminsPending(params: { what: string; title: string; path: string }) {
  const admins = await prisma.user.findMany({ where: { role: "ADMIN", isBlocked: false }, select: { email: true } });
  return sendEmail({
    to: admins.map(admin => admin.email),
    subject: `Novo item para analisar: ${params.title}`,
    paragraphs: [`${params.what}: "${params.title}".`],
    action: { label: "Abrir painel", path: params.path },
  });
}

export async function notifyAvailabilityReminder(params: { to: string; title: string; pauseAt: Date }) {
  return sendEmail({
    to: params.to,
    subject: `Seu imóvel ainda está disponível? ${params.title}`,
    paragraphs: [
      `Para manter o catálogo do Achei no Vale atualizado, confirme se o imóvel "${params.title}" continua disponível.`,
      `Sem confirmação até ${formatDate(params.pauseAt)}, o anúncio será pausado automaticamente. Se ele já foi alugado ou vendido, arquive o anúncio.`,
    ],
    action: { label: "Confirmar em Meus anúncios", path: "/meus-anuncios" },
  });
}

export async function notifyAutoPaused(params: { to: string; title: string }) {
  return sendEmail({
    to: params.to,
    subject: `Anúncio pausado por falta de confirmação: ${params.title}`,
    paragraphs: [
      `O anúncio "${params.title}" foi pausado porque não recebemos a confirmação de que o imóvel continua disponível.`,
      "Se ele ainda estiver disponível, basta reativá-lo em Meus anúncios.",
    ],
    action: { label: "Abrir Meus anúncios", path: "/meus-anuncios" },
  });
}
