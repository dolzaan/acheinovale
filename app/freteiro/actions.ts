"use server";

import { redirect } from "next/navigation";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db";
import { freighterUrl } from "@/lib/listings/urls";
import { checkRateLimit } from "@/lib/security/rate-limit";

const REPORT_REASONS = new Set(["Contato incorreto", "Suspeita de fraude", "Serviço inexistente", "Conteúdo inadequado", "Outro"]);

export async function reportFreighter(profileId: string, formData: FormData) {
  const profile = await prisma.freighterProfile.findUnique({ where: { id: profileId } });
  if (!profile) redirect("/freteiros");
  const destination = freighterUrl(profile);
  const user = await requireCurrentUser(destination);
  const reasonValue = formData.get("reason");
  const detailsValue = formData.get("details");
  const reason = typeof reasonValue === "string" ? reasonValue : "";
  const details = typeof detailsValue === "string" ? detailsValue.trim().slice(0, 500) : "";
  if (!REPORT_REASONS.has(reason) || profile.userId === user.id) redirect(`${destination}?denuncia=erro`);

  const rateLimit = await checkRateLimit({ scope: "denunciar-freteiro", identifier: user.id, limit: 3, windowSeconds: 24 * 60 * 60 });
  if (!rateLimit.allowed) redirect(`${destination}?denuncia=limite`);

  const existing = await prisma.report.findFirst({
    where: { reporterId: user.id, freighterProfileId: profile.id, status: "OPEN" },
    select: { id: true },
  });
  if (!existing) {
    await prisma.report.create({
      data: { reporterId: user.id, freighterProfileId: profile.id, reason, details: details || null },
    });
  }
  redirect(`${destination}?denuncia=enviada`);
}
