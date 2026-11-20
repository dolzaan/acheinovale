import { after, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db";
import { allowListingEvent, metricCounters, metricDay, readListingEvent } from "@/lib/metrics/listing-events";

type Props = { params: Promise<{ publicCode: string }> };

export async function POST(request: Request, { params }: Props) {
  const { publicCode } = await params;
  const type = await readListingEvent(request);
  if (!type) return NextResponse.json({ error: "Evento inválido." }, { status: 400 });

  const [profile, viewer] = await Promise.all([
    prisma.freighterProfile.findFirst({
      where: { publicCode, status: "ACTIVE" },
      select: { id: true, userId: true },
    }),
    type === "whatsapp" ? getCurrentUser() : null,
  ]);
  // Quem abre o WhatsApp logado passa a poder avaliar o freteiro. Fica antes da
  // resposta porque a página recarrega ao voltar e já precisa mostrar o formulário.
  if (profile && type === "whatsapp") {
    if (viewer && viewer.id !== profile.userId) {
      await prisma.freighterContact.upsert({
        where: { userId_profileId: { userId: viewer.id, profileId: profile.id } },
        create: { userId: viewer.id, profileId: profile.id },
        update: {},
      }).catch(error => console.warn("[freteiro/contato] Contato não registrado.", error instanceof Error ? error.message : String(error)));
    }
  }
  if (!profile) return new NextResponse(null, { status: 204 });

  // A resposta é sempre 204: o limite e a contagem rodam depois de responder.
  after(async () => {
    if (!await allowListingEvent(request, "metrica-freteiro", profile.id, type)) return;
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
  });
  return new NextResponse(null, { status: 204 });
}
