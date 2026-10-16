"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db";
import { notifyAdminsPending, sendLater } from "@/lib/email/notifications";
import { revalidatePublicListings } from "@/lib/listings/public-cache";
import { FREIGHTER_REPORT_REASONS } from "@/lib/listings/report-reasons";
import { freighterUrl } from "@/lib/listings/urls";
import { checkRateLimit } from "@/lib/security/rate-limit";

export async function reportFreighter(profileId: string, formData: FormData) {
  const profile = await prisma.freighterProfile.findUnique({ where: { id: profileId } });
  if (!profile) redirect("/freteiros");
  const destination = freighterUrl(profile);
  const user = await requireCurrentUser(destination);
  const reasonValue = formData.get("reason");
  const detailsValue = formData.get("details");
  const reason = typeof reasonValue === "string" ? reasonValue : "";
  const details = typeof detailsValue === "string" ? detailsValue.trim().slice(0, 500) : "";
  if (!FREIGHTER_REPORT_REASONS.includes(reason) || profile.userId === user.id) redirect(`${destination}?denuncia=erro`);

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
    sendLater(() => notifyAdminsPending({ what: `Nova denúncia de freteiro (${reason})`, title: profile.displayName, path: "/admin/denuncias" }));
  }
  redirect(`${destination}?denuncia=enviada`);
}

export async function submitReview(profileId: string, formData: FormData) {
  const profile = await prisma.freighterProfile.findFirst({ where: { id: profileId, status: "ACTIVE" } });
  if (!profile) redirect("/freteiros");
  const destination = freighterUrl(profile);
  const user = await requireCurrentUser(destination);
  if (profile.userId === user.id) redirect(`${destination}?avaliacao=erro#avaliacoes`);

  const rating = Number(formData.get("rating"));
  const commentValue = formData.get("comment");
  const comment = typeof commentValue === "string" ? commentValue.trim().slice(0, 600) : "";
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) redirect(`${destination}?avaliacao=erro#avaliacoes`);

  const [contact, ownReview] = await Promise.all([
    prisma.freighterContact.findUnique({ where: { userId_profileId: { userId: user.id, profileId: profile.id } }, select: { id: true } }),
    prisma.review.findUnique({ where: { authorId_profileId: { authorId: user.id, profileId: profile.id } }, select: { id: true } }),
  ]);
  if (!contact && !ownReview) redirect(`${destination}?avaliacao=contato#avaliacoes`);

  const rateLimit = await checkRateLimit({ scope: "avaliar-freteiro", identifier: user.id, limit: 10, windowSeconds: 24 * 60 * 60 });
  if (!rateLimit.allowed) redirect(`${destination}?avaliacao=limite#avaliacoes`);

  // Uma avaliação por usuário e perfil. Editar não reexibe uma avaliação ocultada pela moderação.
  await prisma.review.upsert({
    where: { authorId_profileId: { authorId: user.id, profileId: profile.id } },
    create: { authorId: user.id, profileId: profile.id, rating, comment: comment || null },
    update: { rating, comment: comment || null },
  });

  revalidatePublicListings();
  revalidatePath(destination);
  redirect(`${destination}?avaliacao=enviada#avaliacoes`);
}
