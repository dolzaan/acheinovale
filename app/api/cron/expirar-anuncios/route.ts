import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isEmailConfigured } from "@/lib/email/mailer";
import { notifyAutoPaused, notifyAvailabilityReminder } from "@/lib/email/notifications";
import { AUTO_PAUSE_NOTE, availabilityAskWhere, availabilityDeadline, expiredAvailabilityWhere, reminderIsDue } from "@/lib/listings/availability";
import { revalidatePublicListings } from "@/lib/listings/public-cache";
import { isAuthorizedCronRequest } from "@/lib/security/cron";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BATCH_SIZE = 200;

// Executado diariamente pelo Vercel Cron (vercel.json).
export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  const now = new Date();
  const ownerSelect = { owner: { select: { email: true } } } as const;

  // 1. Pausa os anúncios sem confirmação no prazo total.
  const expired = await prisma.property.findMany({
    where: expiredAvailabilityWhere(now),
    select: { id: true, title: true, ...ownerSelect },
    take: BATCH_SIZE,
  });
  if (expired.length) {
    await prisma.property.updateMany({
      where: { id: { in: expired.map(property => property.id) }, ...expiredAvailabilityWhere(now) },
      data: { status: "PAUSED", moderationNote: AUTO_PAUSE_NOTE },
    });
    revalidatePublicListings();
    for (const property of expired) await notifyAutoPaused({ to: property.owner.email, title: property.title });
  }

  // 2. Lembra por e-mail quem entrou no prazo de confirmação. Sem SMTP, o aviso
  //    continua aparecendo em "Meus anúncios" e o lembrete fica para o próximo dia.
  let reminded = 0;
  if (isEmailConfigured()) {
    const candidates = await prisma.property.findMany({
      where: availabilityAskWhere(now),
      select: { id: true, title: true, availabilityConfirmedAt: true, availabilityReminderSentAt: true, publishedAt: true, createdAt: true, ...ownerSelect },
      take: BATCH_SIZE * 2,
    });
    for (const property of candidates.filter(reminderIsDue).slice(0, BATCH_SIZE)) {
      const sent = await notifyAvailabilityReminder({ to: property.owner.email, title: property.title, pauseAt: availabilityDeadline(property).pauseAt });
      if (sent) {
        await prisma.property.update({ where: { id: property.id }, data: { availabilityReminderSentAt: now } });
        reminded += 1;
      }
    }
  }

  console.info(JSON.stringify({ level: "info", message: "availability_cron", paused: expired.length, reminded }));
  return NextResponse.json({ paused: expired.length, reminded });
}
