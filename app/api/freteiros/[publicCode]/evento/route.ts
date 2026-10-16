import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db";
import { allowListingEvent, metricCounters, metricDay, readListingEvent } from "@/lib/metrics/listing-events";

type Props = { params: Promise<{ publicCode: string }> };

export async function POST(request: Request, { params }: Props) {
  const { publicCode } = await params;
  const type = await readListingEvent(request);
  if (!type) return NextResponse.json({ error: "Evento inválido." }, { status: 400 });

  const profile = await prisma.freighterProfile.findFirst({
    where: { publicCode, status: "ACTIVE" },
    select: { id: true, userId: true },
  });
  // Quem abre o WhatsApp logado passa a poder avaliar o freteiro.
  if (profile && type === "whatsapp") {
    const viewer = await getCurrentUser();
    if (viewer && viewer.id !== profile.userId) {
      await prisma.freighterContact.upsert({
        where: { userId_profileId: { userId: viewer.id, profileId: profile.id } },
        create: { userId: viewer.id, profileId: profile.id },
        update: {},
      }).catch(error => console.warn("[freteiro/contato] Contato não registrado.", error instanceof Error ? error.message : String(error)));
    }
  }
  if (!profile || !await allowListingEvent(request, "metrica-freteiro", profile.id, type)) {
    return new NextResponse(null, { status: 204 });
  }

  const date = metricDay();
  const counters = metricCounters(type);
  try {
    await prisma.freighterMetricDaily.upsert({
      where: { profileId_date: { profileId: profile.id, date } },
      create: { profileId: profile.id, date, ...counters.create },
      update: counters.update,
    });
  } catch (error) {
    console.warn("[freteiro/metrica] Métrica não registrada.", error instanceof Error ? error.message : String(error));
  }
  return new NextResponse(null, { status: 204 });
}
