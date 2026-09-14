import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/security/rate-limit";

type Props = { params: Promise<{ publicCode: string }> };

export async function POST(request: Request, { params }: Props) {
  const { publicCode } = await params;
  const body = await request.json().catch(() => null) as { type?: unknown } | null;
  if (body?.type !== "view" && body?.type !== "whatsapp") return NextResponse.json({ error: "Evento inválido." }, { status: 400 });

  const profile = await prisma.freighterProfile.findFirst({
    where: { publicCode, status: "ACTIVE" },
    select: { id: true },
  });
  if (!profile) return new NextResponse(null, { status: 204 });

  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const identifier = `${forwarded || "sem-ip"}:${profile.id}:${body.type}`;
  const rateLimit = await checkRateLimit({
    scope: "metrica-freteiro",
    identifier,
    limit: body.type === "view" ? 4 : 12,
    windowSeconds: 60 * 60,
  });
  if (!rateLimit.allowed) return new NextResponse(null, { status: 204 });

  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  try {
    await prisma.freighterMetricDaily.upsert({
      where: { profileId_date: { profileId: profile.id, date } },
      create: {
        profileId: profile.id,
        date,
        views: body.type === "view" ? 1 : 0,
        whatsappClicks: body.type === "whatsapp" ? 1 : 0,
      },
      update: body.type === "view"
        ? { views: { increment: 1 } }
        : { whatsappClicks: { increment: 1 } },
    });
  } catch (error) {
    console.warn("[freteiro/metrica] Métrica não registrada.", error instanceof Error ? error.message : String(error));
  }
  return new NextResponse(null, { status: 204 });
}
