import "server-only";

import { prisma } from "@/lib/db";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "AcheiNoVale/1.0 (+https://acheinovale.vercel.app)";
// Depois de uma tentativa sem resultado, só tenta de novo passado este prazo.
const RETRY_AFTER_MS = 30 * 24 * 60 * 60 * 1000;
const NEIGHBORHOOD_TYPES = new Set(["suburb", "quarter", "neighbourhood", "residential", "administrative", "hamlet", "village", "isolated_dwelling", "locality"]);

type NominatimResult = {
  lat: string;
  lon: string;
  name?: string;
  addresstype?: string;
  type?: string;
  address?: Record<string, string>;
};

export function comparablePlaceName(value: string) {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/**
 * Escolhe o resultado do Nominatim que é de fato o bairro pedido, dentro da cidade pedida.
 * Sem isso, uma busca por bairro desconhecido devolve o centro da cidade, e o mapa
 * marcaria um bairro errado.
 */
export function pickNeighborhoodResult(results: NominatimResult[], neighborhoodName: string, cityName: string) {
  const wantedNeighborhood = comparablePlaceName(neighborhoodName);
  const wantedCity = comparablePlaceName(cityName);
  for (const result of results) {
    const placeType = result.addresstype ?? result.type ?? "";
    if (!NEIGHBORHOOD_TYPES.has(placeType)) continue;
    if (comparablePlaceName(result.name ?? "") !== wantedNeighborhood) continue;
    const address = result.address ?? {};
    const resultCity = address.city ?? address.town ?? address.municipality ?? address.village ?? "";
    if (comparablePlaceName(resultCity) !== wantedCity) continue;
    const latitude = Number(result.lat);
    const longitude = Number(result.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;
    return { latitude, longitude };
  }
  return null;
}

export function shouldGeocode(neighborhood: { latitude: unknown; geocodedAt: Date | null }, now = new Date()) {
  if (neighborhood.latitude !== null) return false;
  return !neighborhood.geocodedAt || now.getTime() - neighborhood.geocodedAt.getTime() > RETRY_AFTER_MS;
}

/** Procura o centro do bairro no OpenStreetMap e guarda no banco, achando ou não. */
export async function geocodeNeighborhood(neighborhood: { id: string; name: string; city: { name: string; stateCode: string } }) {
  const params = new URLSearchParams({
    q: `${neighborhood.name}, ${neighborhood.city.name}, ${neighborhood.city.stateCode === "SC" ? "Santa Catarina" : neighborhood.city.stateCode}, Brasil`,
    format: "jsonv2",
    addressdetails: "1",
    countrycodes: "br",
    limit: "5",
  });
  let found: { latitude: number; longitude: number } | null = null;
  try {
    const response = await fetch(`${NOMINATIM_URL}?${params}`, {
      headers: { "User-Agent": USER_AGENT, "Accept-Language": "pt-BR" },
      signal: AbortSignal.timeout(6000),
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    found = pickNeighborhoodResult(await response.json() as NominatimResult[], neighborhood.name, neighborhood.city.name);
  } catch (error) {
    // Falha de rede não marca a tentativa: a próxima visita tenta de novo.
    console.warn("[geocode] Não foi possível localizar o bairro.", {
      neighborhoodId: neighborhood.id,
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
  await prisma.neighborhood.update({
    where: { id: neighborhood.id },
    data: { geocodedAt: new Date(), ...(found ? { latitude: found.latitude, longitude: found.longitude } : {}) },
  });
  return found;
}
