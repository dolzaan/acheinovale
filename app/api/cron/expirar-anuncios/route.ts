import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AUTO_PAUSE_NOTE, expiredAvailabilityWhere } from "@/lib/listings/availability";
import { revalidatePublicListings } from "@/lib/listings/public-cache";

export const dynamic = "force-dynamic";

// Executado diariamente pelo Vercel Cron (vercel.json). A Vercel envia
// "Authorization: Bearer $CRON_SECRET" quando a variável está configurada.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { count } = await prisma.property.updateMany({
    where: expiredAvailabilityWhere(),
    data: { status: "PAUSED", moderationNote: AUTO_PAUSE_NOTE },
  });

  if (count) revalidatePublicListings();
  console.info(JSON.stringify({ level: "info", message: "properties_auto_paused", count }));
  return NextResponse.json({ paused: count });
}
