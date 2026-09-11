import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type NominatimAddress = {
  city?: string;
  town?: string;
  municipality?: string;
  village?: string;
  state?: string;
  "ISO3166-2-lvl4"?: string;
};

type NominatimResponse = {
  address?: NominatimAddress;
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export async function GET(request: NextRequest) {
  const latitude = Number(request.nextUrl.searchParams.get("latitude"));
  const longitude = Number(request.nextUrl.searchParams.get("longitude"));

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return NextResponse.json({ error: "Coordenadas inválidas." }, { status: 400 });
  }

  try {
    const reverseUrl = new URL("https://nominatim.openstreetmap.org/reverse");
    reverseUrl.searchParams.set("format", "jsonv2");
    reverseUrl.searchParams.set("lat", String(latitude));
    reverseUrl.searchParams.set("lon", String(longitude));
    reverseUrl.searchParams.set("addressdetails", "1");
    reverseUrl.searchParams.set("zoom", "10");

    const response = await fetch(reverseUrl, {
      headers: {
        "User-Agent": "AcheiNoVale/1.0 (https://acheinovale.com.br)",
        "Accept-Language": "pt-BR,pt;q=0.9",
      },
      next: { revalidate: 86400 },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Não foi possível identificar a localização." }, { status: 502 });
    }

    const data = (await response.json()) as NominatimResponse;
    const detectedName = data.address?.city || data.address?.town || data.address?.municipality || data.address?.village;
    if (!detectedName) {
      return NextResponse.json({ error: "Cidade não identificada." }, { status: 404 });
    }

    const stateCode = data.address?.["ISO3166-2-lvl4"]?.split("-").pop()?.toUpperCase();
    const cities = await prisma.city.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true, stateCode: true },
    });

    const normalizedDetectedName = normalize(detectedName);
    const city = cities.find(candidate => {
      const sameName = normalize(candidate.name) === normalizedDetectedName;
      const sameState = !stateCode || candidate.stateCode.toUpperCase() === stateCode;
      return sameName && sameState;
    });

    if (!city) {
      return NextResponse.json({ error: "A cidade detectada ainda não está disponível no Achei no Vale." }, { status: 404 });
    }

    return NextResponse.json(city, {
      headers: { "Cache-Control": "private, max-age=3600" },
    });
  } catch {
    return NextResponse.json({ error: "Não foi possível detectar a cidade." }, { status: 503 });
  }
}
