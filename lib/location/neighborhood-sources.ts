import "server-only";

import { normalizeNeighborhoodName } from "@/lib/location/neighborhood";
import { slugify } from "@/lib/validation/listing";

// O IBGE não tem API de bairros (a de localidades vai até distritos e subdistritos).
// A fonte é o OpenStreetMap, consultado pelo código IBGE do município.
// Servidores públicos da Overpass, tentados em ordem: o principal às vezes recusa
// clientes (406) ou fica sobrecarregado (502/504), e os espelhos cobrem essas falhas.
const OVERPASS_URLS = [
  "https://overpass-api.de/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];
const IBGE_MUNICIPALITIES_URL = "https://servicodados.ibge.gov.br/api/v1/localidades/estados";
const USER_AGENT = "AcheiNoVale/1.0 (+https://acheinovale.vercel.app)";
const ONE_DAY = 60 * 60 * 24;

/**
 * - official: limite administrativo de bairro (admin_level 10), definido pela prefeitura.
 * - neighborhood: bairro mapeado como ponto ou área (place=suburb/quarter).
 * - subdivision: loteamento, condomínio ou vila (place=neighbourhood); nem sempre é bairro.
 */
export type NeighborhoodSuggestionKind = "official" | "neighborhood" | "subdivision";

export type NeighborhoodSuggestion = { name: string; slug: string; kind: NeighborhoodSuggestionKind };

type OverpassElement = { tags?: Record<string, string> };

function comparableName(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

/** Código IBGE de 7 dígitos: o salvo na cidade ou, se faltar, o da API do IBGE pelo nome. */
export async function findMunicipalityIbgeCode(city: { name: string; stateCode: string; ibgeCode: string | null }) {
  if (city.ibgeCode && /^\d{7}$/.test(city.ibgeCode)) return city.ibgeCode;
  const response = await fetch(`${IBGE_MUNICIPALITIES_URL}/${encodeURIComponent(city.stateCode)}/municipios`, {
    headers: { Accept: "application/json" },
    next: { revalidate: ONE_DAY * 30 },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) return null;
  const municipalities = await response.json() as Array<{ id: number; nome: string }>;
  const match = municipalities.find(municipality => comparableName(municipality.nome) === comparableName(city.name));
  return match ? String(match.id) : null;
}

function overpassQuery(ibgeCode: string) {
  const place = '["place"~"^(suburb|quarter|neighbourhood)$"]';
  return `[out:json][timeout:50];
area["boundary"="administrative"]["admin_level"="8"]["IBGE:GEOCODIGO"="${ibgeCode}"]->.city;
(node${place}(area.city);way${place}(area.city);relation${place}(area.city);
relation["boundary"="administrative"]["admin_level"="10"](area.city););
out tags;`;
}

function kindOf(tags: Record<string, string>): NeighborhoodSuggestionKind | null {
  if (tags.boundary === "administrative" && tags.admin_level === "10") return "official";
  if (tags.place === "suburb" || tags.place === "quarter") return "neighborhood";
  if (tags.place === "neighbourhood") return "subdivision";
  return null;
}

const KIND_PRIORITY: Record<NeighborhoodSuggestionKind, number> = { official: 0, neighborhood: 1, subdivision: 2 };

/** Bairros do município no OpenStreetMap, sem repetidos, do mais confiável para o menos. */
export async function fetchOsmNeighborhoods(ibgeCode: string): Promise<NeighborhoodSuggestion[]> {
  if (!/^\d{7}$/.test(ibgeCode)) return [];
  const query = new URLSearchParams({ data: overpassQuery(ibgeCode) });
  const failures: string[] = [];
  let elements: OverpassElement[] | null = null;
  for (const url of OVERPASS_URLS) {
    try {
      const response = await fetch(`${url}?${query}`, {
        headers: { "User-Agent": USER_AGENT },
        // GET para entrar no cache de dados: os bairros quase não mudam e a tela pode ser reaberta.
        next: { revalidate: ONE_DAY },
        // Três tentativas cabem no maxDuration de 60s da página.
        signal: AbortSignal.timeout(18_000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      elements = (await response.json() as { elements: OverpassElement[] }).elements;
      break;
    } catch (error) {
      failures.push(`${new URL(url).host}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  if (!elements) throw new Error(`Overpass indisponível (${failures.join("; ")})`);

  const bySlug = new Map<string, NeighborhoodSuggestion>();
  for (const { tags } of elements) {
    if (!tags?.name) continue;
    const kind = kindOf(tags);
    const name = normalizeNeighborhoodName(tags.name);
    const slug = slugify(name);
    if (!kind || !slug || name.length < 2 || name.length > 80) continue;
    const current = bySlug.get(slug);
    // O mesmo bairro costuma vir como limite e como ponto: fica a versão mais confiável.
    if (!current || KIND_PRIORITY[kind] < KIND_PRIORITY[current.kind]) bySlug.set(slug, { name, slug, kind });
  }
  return [...bySlug.values()].sort((a, b) => KIND_PRIORITY[a.kind] - KIND_PRIORITY[b.kind] || a.name.localeCompare(b.name, "pt-BR"));
}
