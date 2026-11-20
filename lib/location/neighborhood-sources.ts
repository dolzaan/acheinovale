import "server-only";

import { officialNeighborhoods } from "@/data/official-neighborhoods";
import { normalizeNeighborhoodName } from "@/lib/location/neighborhood";
import { slugify } from "@/lib/validation/listing";

// O IBGE não tem API de bairros (a de localidades vai até distritos e subdistritos).
// As fontes são as listas das prefeituras guardadas em data/official-neighborhoods.ts
// e o OpenStreetMap, consultado pelo código IBGE do município.
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
 * - official: bairro da lista da prefeitura ou limite administrativo de bairro no OSM (admin_level 10).
 * - neighborhood: bairro mapeado no OSM como ponto ou área (place=suburb/quarter).
 * - rural: comunidade do interior que a prefeitura lista separada dos bairros.
 * - subdivision: loteamento, condomínio ou vila no OSM (place=neighbourhood); nem sempre é bairro.
 */
export type NeighborhoodSuggestionKind = "official" | "neighborhood" | "rural" | "subdivision";

export type NeighborhoodSuggestionSource = "prefeitura" | "osm";

export type NeighborhoodSuggestion = { name: string; slug: string; kind: NeighborhoodSuggestionKind; source: NeighborhoodSuggestionSource };

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

const KIND_PRIORITY: Record<NeighborhoodSuggestionKind, number> = { official: 0, neighborhood: 1, rural: 2, subdivision: 3 };

function toSuggestion(rawName: string, kind: NeighborhoodSuggestionKind, source: NeighborhoodSuggestionSource): NeighborhoodSuggestion | null {
  const name = normalizeNeighborhoodName(rawName);
  const slug = slugify(name);
  return slug && name.length >= 2 && name.length <= 80 ? { name, slug, kind, source } : null;
}

/** Junta listas sem repetir bairros: fica a versão mais confiável e, no empate, a da prefeitura. */
function mergeSuggestions(lists: NeighborhoodSuggestion[][]) {
  const bySlug = new Map<string, NeighborhoodSuggestion>();
  for (const suggestion of lists.flat()) {
    const current = bySlug.get(suggestion.slug);
    if (!current || KIND_PRIORITY[suggestion.kind] < KIND_PRIORITY[current.kind]) bySlug.set(suggestion.slug, suggestion);
  }
  return [...bySlug.values()].sort((a, b) => KIND_PRIORITY[a.kind] - KIND_PRIORITY[b.kind] || a.name.localeCompare(b.name, "pt-BR"));
}

function officialSuggestions(ibgeCode: string): NeighborhoodSuggestion[] {
  const list = officialNeighborhoods[ibgeCode];
  if (!list) return [];
  return [
    ...list.neighborhoods.map(name => toSuggestion(name, "official", "prefeitura")),
    ...list.ruralLocalities.map(name => toSuggestion(name, "rural", "prefeitura")),
  ].filter(suggestion => suggestion !== null);
}

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

  // O mesmo bairro costuma vir como limite e como ponto: a junção fica com a versão mais confiável.
  return mergeSuggestions([elements.flatMap(({ tags }) => {
    const kind = tags?.name ? kindOf(tags) : null;
    const suggestion = kind && tags?.name ? toSuggestion(tags.name, kind, "osm") : null;
    return suggestion ? [suggestion] : [];
  })]);
}

export type NeighborhoodSuggestionsResult = {
  suggestions: NeighborhoodSuggestion[];
  /** A consulta ao OpenStreetMap falhou; a lista pode trazer só a da prefeitura. */
  osmUnavailable: boolean;
  officialSource: { source: string; sourceUrl: string; confidence: "alta" | "média" | "baixa" } | null;
};

/** Bairros sugeridos para a cidade: a lista da prefeitura (se houver) mais o OpenStreetMap. */
export async function loadNeighborhoodSuggestions(city: { name: string; stateCode: string; ibgeCode: string | null }): Promise<NeighborhoodSuggestionsResult> {
  const ibgeCode = await findMunicipalityIbgeCode(city).catch(() => null);
  if (!ibgeCode) return { suggestions: [], osmUnavailable: true, officialSource: null };

  const official = officialNeighborhoods[ibgeCode];
  let osm: NeighborhoodSuggestion[] = [];
  let osmUnavailable = false;
  try {
    osm = await fetchOsmNeighborhoods(ibgeCode);
  } catch (error) {
    osmUnavailable = true;
    console.warn(JSON.stringify({ level: "warning", message: "osm_neighborhoods_failed", city: city.name, error: error instanceof Error ? error.message : String(error) }));
  }
  return {
    suggestions: mergeSuggestions([officialSuggestions(ibgeCode), osm]),
    osmUnavailable,
    officialSource: official ? { source: official.source, sourceUrl: official.sourceUrl, confidence: official.confidence } : null,
  };
}

/**
 * Bairros da lista da prefeitura (sem o OpenStreetMap), para adicionar em todas as cidades de
 * uma vez. Localidades rurais entram só quando pedidas.
 */
export async function loadOfficialNeighborhoods(city: { name: string; stateCode: string; ibgeCode: string | null }, includeRural: boolean) {
  const ibgeCode = await findMunicipalityIbgeCode(city).catch(() => null);
  if (!ibgeCode) return [];
  return officialSuggestions(ibgeCode).filter(suggestion => suggestion.kind === "official" || (includeRural && suggestion.kind === "rural"));
}
