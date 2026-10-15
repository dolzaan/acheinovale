import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getActiveLocations } from "@/lib/listings/public-cache";

export const dynamic = "force-dynamic";

type Coordinates = { latitude: number; longitude: number };

// Coordenadas aproximadas dos municípios atendidos no Alto Vale do Itajaí.
// A lista é cruzada com as cidades ativas no banco antes de escolher o destino.
const CITY_COORDINATES: Record<string, Coordinates> = {
  "rio-do-sul": { latitude: -27.2142, longitude: -49.6431 },
  "lontras": { latitude: -27.1684, longitude: -49.5353 },
  "aurora": { latitude: -27.3097, longitude: -49.6297 },
  "agronomica": { latitude: -27.2664, longitude: -49.7081 },
  "laurentino": { latitude: -27.2178, longitude: -49.7331 },
  "pouso-redondo": { latitude: -27.2569, longitude: -49.9306 },
  "trombudo-central": { latitude: -27.3039, longitude: -49.7936 },
  "braco-do-trombudo": { latitude: -27.3586, longitude: -49.8839 },
  "taio": { latitude: -27.1150, longitude: -49.9986 },
  "salete": { latitude: -26.9792, longitude: -50.0019 },
  "mirim-doce": { latitude: -27.1972, longitude: -50.0781 },
  "ibirama": { latitude: -27.0569, longitude: -49.5197 },
  "presidente-getulio": { latitude: -27.0475, longitude: -49.6242 },
  "dona-emma": { latitude: -26.9808, longitude: -49.7269 },
  "witmarsum": { latitude: -26.9278, longitude: -49.7947 },
  "vitor-meireles": { latitude: -26.8781, longitude: -49.8328 },
  "jose-boiteux": { latitude: -26.9569, longitude: -49.6281 },
  "petrolandia": { latitude: -27.5342, longitude: -49.6939 },
  "imbuia": { latitude: -27.4908, longitude: -49.4219 },
  "atalanta": { latitude: -27.4211, longitude: -49.7786 },
  "ituporanga": { latitude: -27.4101, longitude: -49.5963 },
  "imbituba": { latitude: -28.2400, longitude: -48.6700 },
  "blumenau": { latitude: -26.9194, longitude: -49.0661 },
};

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function distanceKm(a: Coordinates, b: Coordinates) {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const dLat = radians(b.latitude - a.latitude);
  const dLon = radians(b.longitude - a.longitude);
  const lat1 = radians(a.latitude);
  const lat2 = radians(b.latitude);
  const value = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

export async function GET() {
  const requestHeaders = await headers();
  const country = requestHeaders.get("x-vercel-ip-country");
  if (country && country !== "BR") {
    return NextResponse.json({ city: null }, { headers: { "Cache-Control": "private, no-store" } });
  }

  const activeCities = await getActiveLocations();
  const ipCity = requestHeaders.get("x-vercel-ip-city");
  if (ipCity) {
    const normalizedIpCity = normalize(decodeURIComponentSafe(ipCity));
    const exactCity = activeCities.find(city => normalize(city.name) === normalizedIpCity);
    if (exactCity) {
      return NextResponse.json(
        { slug: exactCity.slug, name: exactCity.name },
        { headers: { "Cache-Control": "private, no-store" } },
      );
    }
  }

  const latitude = Number(requestHeaders.get("x-vercel-ip-latitude"));
  const longitude = Number(requestHeaders.get("x-vercel-ip-longitude"));
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)
    || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return NextResponse.json({ city: null }, { headers: { "Cache-Control": "private, no-store" } });
  }

  const origin = { latitude, longitude };
  const nearest = activeCities
    .map(city => {
      const coordinates = CITY_COORDINATES[city.slug];
      return coordinates ? { city, distance: distanceKm(origin, coordinates) } : null;
    })
    .filter((candidate): candidate is { city: (typeof activeCities)[number]; distance: number } => candidate !== null)
    .sort((first, second) => first.distance - second.distance)[0];

  // Fora da área atendida, não escolhemos uma cidade distante automaticamente.
  if (!nearest || nearest.distance > 90) {
    return NextResponse.json({ city: null }, { headers: { "Cache-Control": "private, no-store" } });
  }

  return NextResponse.json(
    { slug: nearest.city.slug, name: nearest.city.name },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

function decodeURIComponentSafe(value: string) {
  try {
    return decodeURIComponent(value.replace(/\+/g, " "));
  } catch {
    return value;
  }
}
