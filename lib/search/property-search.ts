import type { PropertyPurpose, PropertyType } from "@prisma/client";

export type SearchNeighborhood = {
  id: string;
  name: string;
  slug: string;
};

type PropertySearchIntent = {
  purpose?: PropertyPurpose;
  type?: PropertyType;
  neighborhoodIds: string[];
  minimumBedrooms?: number;
  freeTerms: string[];
};

const purposeAliases: Array<{ value: PropertyPurpose; terms: string[] }> = [
  { value: "RENT", terms: ["alugar", "aluguel", "locacao", "locar"] },
  { value: "SALE", terms: ["comprar", "compra", "venda", "vender"] },
];

const typeAliases: Array<{ value: PropertyType; terms: string[] }> = [
  { value: "COMMERCIAL_ROOM", terms: ["sala comercial"] },
  { value: "APARTMENT", terms: ["apartamento", "apartamentos", "apto"] },
  { value: "STUDIO", terms: ["kitnet", "studio", "estudio"] },
  { value: "WAREHOUSE", terms: ["galpao", "barracao"] },
  { value: "LAND", terms: ["terreno", "terrenos", "lote"] },
  { value: "HOUSE", terms: ["casa", "casas", "sobrado"] },
];

const ignoredTerms = new Set([
  "a", "as", "o", "os", "de", "do", "da", "dos", "das", "e", "em",
  "no", "na", "nos", "nas", "para", "pra", "por", "um", "uma", "uns",
  "umas", "quero", "procuro", "procurando", "imovel", "imoveis", "com",
]);

export function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function includesPhrase(text: string, phrase: string) {
  return ` ${text} `.includes(` ${phrase} `);
}

export function parsePropertySearch(
  query: string,
  neighborhoods: SearchNeighborhood[],
): PropertySearchIntent {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return { neighborhoodIds: [], freeTerms: [] };

  const consumedTerms = new Set<string>();
  const consume = (phrase: string) => phrase.split(" ").forEach(term => consumedTerms.add(term));

  const purposeMatch = purposeAliases.find(({ terms }) =>
    terms.some(term => includesPhrase(normalizedQuery, term)),
  );
  purposeMatch?.terms
    .filter(term => includesPhrase(normalizedQuery, term))
    .forEach(consume);

  const typeMatch = typeAliases.find(({ terms }) =>
    terms.some(term => includesPhrase(normalizedQuery, term)),
  );
  typeMatch?.terms
    .filter(term => includesPhrase(normalizedQuery, term))
    .forEach(consume);

  const matchedNeighborhoods = neighborhoods.filter(neighborhood => {
    const names = [normalizeSearchText(neighborhood.name), normalizeSearchText(neighborhood.slug)];
    const matchedName = names.find(name => name && includesPhrase(normalizedQuery, name));
    if (matchedName) consume(matchedName);
    return Boolean(matchedName);
  });

  const bedroomMatch = normalizedQuery.match(/\b(\d{1,2})\s*(?:quarto|quartos|dormitorio|dormitorios)\b/);
  const minimumBedrooms = bedroomMatch ? Number.parseInt(bedroomMatch[1], 10) : undefined;
  if (bedroomMatch) {
    consumedTerms.add(bedroomMatch[1]);
    consumedTerms.add(bedroomMatch[0].split(" ").at(-1) || "");
  }

  const freeTerms = [...new Set(normalizedQuery.split(" "))].filter(term =>
    term.length > 1 && !ignoredTerms.has(term) && !consumedTerms.has(term),
  );

  return {
    ...(purposeMatch ? { purpose: purposeMatch.value } : {}),
    ...(typeMatch ? { type: typeMatch.value } : {}),
    neighborhoodIds: matchedNeighborhoods.map(neighborhood => neighborhood.id),
    ...(minimumBedrooms !== undefined ? { minimumBedrooms } : {}),
    freeTerms,
  };
}
