import { NextResponse } from "next/server";
import { getActiveCityOptions } from "@/lib/listings/public-cache";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cities = await getActiveCityOptions();

    return NextResponse.json(cities, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch {
    return NextResponse.json({ error: "Não foi possível carregar as cidades." }, { status: 503 });
  }
}
