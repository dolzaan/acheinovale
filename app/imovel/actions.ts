"use server";

import { redirect } from "next/navigation";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db";
import { notifyAdminsPending, sendLater } from "@/lib/email/notifications";
import { PROPERTY_REPORT_REASONS } from "@/lib/listings/report-reasons";
import { propertyUrl } from "@/lib/listings/urls";
import { checkRateLimit } from "@/lib/security/rate-limit";

export async function reportProperty(propertyId: string, formData: FormData) {
  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) redirect("/imoveis");
  const destination = propertyUrl(property);
  const user = await requireCurrentUser(destination);
  const reasonValue = formData.get("reason");
  const detailsValue = formData.get("details");
  const reason = typeof reasonValue === "string" ? reasonValue : "";
  const details = typeof detailsValue === "string" ? detailsValue.trim().slice(0, 500) : "";
  if (!PROPERTY_REPORT_REASONS.includes(reason) || property.ownerId === user.id) redirect(`${destination}?denuncia=erro`);

  const rateLimit = await checkRateLimit({ scope: "denunciar-imovel", identifier: user.id, limit: 5, windowSeconds: 24 * 60 * 60 });
  if (!rateLimit.allowed) redirect(`${destination}?denuncia=limite`);

  const existing = await prisma.report.findFirst({
    where: { reporterId: user.id, propertyId: property.id, status: "OPEN" },
    select: { id: true },
  });
  if (!existing) {
    await prisma.report.create({
      data: { reporterId: user.id, propertyId: property.id, reason, details: details || null },
    });
    sendLater(() => notifyAdminsPending({ what: `Nova denúncia de imóvel (${reason})`, title: property.title, path: "/admin/denuncias" }));
  }
  redirect(`${destination}?denuncia=enviada`);
}
