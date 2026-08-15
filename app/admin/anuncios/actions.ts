"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db";
import { freighterUrl, propertyUrl } from "@/lib/listings/urls";

type ModerationIntent = "approve" | "reject" | "pause";

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function parseIntent(formData: FormData): ModerationIntent | null {
  const value = field(formData, "intent");
  return value === "approve" || value === "reject" || value === "pause" ? value : null;
}

function decision(intent: ModerationIntent, note: string) {
  if (intent === "reject" && note.length < 5) {
    redirect("/admin/anuncios?erro=motivo");
  }

  return {
    status: intent === "approve" ? "ACTIVE" as const : intent === "reject" ? "REJECTED" as const : "PAUSED" as const,
    moderationNote: intent === "approve" ? null : note || (intent === "pause" ? "Pausado pela moderação." : null),
  };
}

function refreshModerationPages(detailPath: string) {
  revalidatePath("/admin/anuncios");
  revalidatePath("/meus-anuncios");
  revalidatePath("/imoveis");
  revalidatePath("/freteiros");
  revalidatePath(detailPath);
}

export async function moderateProperty(formData: FormData) {
  const admin = await requireAdmin();
  const id = field(formData, "id");
  const intent = parseIntent(formData);
  if (!id || !intent) redirect("/admin/anuncios?erro=acao");

  const property = await prisma.property.findUnique({ where: { id } });
  if (!property) redirect("/admin/anuncios?erro=nao-encontrado");

  const note = field(formData, "note").slice(0, 500);
  const next = decision(intent, note);
  await prisma.property.update({
    where: { id },
    data: {
      ...next,
      moderatedAt: new Date(),
      moderatedById: admin.id,
      publishedAt: intent === "approve" ? property.publishedAt ?? new Date() : property.publishedAt,
    },
  });

  refreshModerationPages(propertyUrl(property));
  redirect(`/admin/anuncios?concluido=${intent}`);
}

export async function moderateFreighter(formData: FormData) {
  const admin = await requireAdmin();
  const id = field(formData, "id");
  const intent = parseIntent(formData);
  if (!id || !intent) redirect("/admin/anuncios?erro=acao");

  const freighter = await prisma.freighterProfile.findUnique({ where: { id } });
  if (!freighter) redirect("/admin/anuncios?erro=nao-encontrado");

  const note = field(formData, "note").slice(0, 500);
  const next = decision(intent, note);
  await prisma.freighterProfile.update({
    where: { id },
    data: {
      ...next,
      moderatedAt: new Date(),
      moderatedById: admin.id,
      publishedAt: intent === "approve" ? freighter.publishedAt ?? new Date() : freighter.publishedAt,
    },
  });

  refreshModerationPages(freighterUrl(freighter));
  redirect(`/admin/anuncios?concluido=${intent}`);
}
