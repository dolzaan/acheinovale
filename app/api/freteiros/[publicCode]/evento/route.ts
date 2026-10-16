import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { allowListingEvent, metricCounters, metricDay, readListingEvent } from "@/lib/metrics/listing-events";

type Props = { params: Promise<{ publicCode: string }> };

export async function POST(request: Request, { params }: Props) {
  const { publicCode } = await params;
  const type = await readListingEvent(request);
  if (!type) return NextResponse.json({ error: "Evento inválido." }, { status: 400 });

  const profile = await prisma.freighterProfile.findFirst({
    where: { publicCode, status: "ACTIVE" },
    select: { id: true },
  });
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
