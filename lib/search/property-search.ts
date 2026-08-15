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
  minimumPriceCents?: number;
  maximumPriceCents?: number;
  minimumBedrooms?: number;
  minimumBathrooms?: number;
  minimumParkingSpots?: number;
  minimumAreaM2?: number;
  acceptsPets?: boolean;
  furnished?: boolean;
  freeTerms: string[];
};

const purposeAliases: Array<{ value: PropertyPurpose; terms: string[] }> = [
  { value: "RENT", terms: ["alugar", "aluguel", "locacao", "locar", "arrendar"] },
  { value: "SALE", terms: ["comprar", "compra", "venda", "vender"] },
];

const typeAliases: Array<{ value: PropertyType; terms: string[] }> = [
  { value: "COMMERCIAL_ROOM", terms: ["sala comercial"] },
  { value: "APARTMENT", terms: ["apartamento", "apartamentos", "apto", "aptos"] },
  { value: "STUDIO", terms: ["kitnet", "quitinete", "studio", "estudio"] },
  { value: "WAREHOUSE", terms: ["galpao", "galpoes", "barracao", "deposito"] },
  { value: "LAND", terms: ["terreno", "terrenos", "lote", "lotes"] },
  { value: "HOUSE", terms: ["casa", "casas", "sobrado", "residencia"] },
];

const ignoredTerms = new Set([
  "a", "as", "o", "os", "de", "do", "da", "dos", "das", "e", "em",
  "no", "na", "nos", "nas", "para", "pra", "por", "um", "uma", "uns",
  "umas", "quero", "procuro", "procurando", "imovel", "imoveis", "com",
  "bairro", "cidade", "regiao", "localizado", "localizada", "perto", "rio",
  "sul", "valor", "preco", "reais", "real",
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

function parseBrazilianAmount(value: string, multiplier: string | undefined) {
  const compact = value.replace(/\s/g, "");
  let amount: number;

  if (multiplier) {
    amount = Number.parseFloat(compact.replace(".", "").replace(",", ".")) * 1_000;
  } else if (/^\d{1,3}(?:\.\d{3})+$/.test(compact)) {
    amount = Number.parseInt(compact.replace(/\./g, ""), 10);
  } else {
    amount = Number.parseFloat(compact.replace(",", "."));
  }

  return Number.isFinite(amount) && amount >= 0 && amount <= 100_000_000
    ? Math.round(amount * 100)
    : undefined;
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
  if (bedroomMatch) consume(bedroomMatch[0]);

  const bathroomMatch = normalizedQuery.match(/\b(\d{1,2})\s*(?:banheiro|banheiros)\b/);
  const minimumBathrooms = bathroomMatch ? Number.parseInt(bathroomMatch[1], 10) : undefined;
  if (bathroomMatch) consume(bathroomMatch[0]);

  const parkingMatch = normalizedQuery.match(/\b(\d{1,2})\s*(?:vaga|vagas)(?:\s+de\s+garagem)?\b/);
  const minimumParkingSpots = parkingMatch ? Number.parseInt(parkingMatch[1], 10) : undefined;
  if (parkingMatch) consume(parkingMatch[0]);

  const areaMatch = normalizedQuery.match(/\b(\d{1,6})\s*(?:m2|metros?\s+quadrados?|de\s+area)\b/);
  const minimumAreaM2 = areaMatch ? Number.parseInt(areaMatch[1], 10) : undefined;
  if (areaMatch) consume(areaMatch[0]);

  const petsPhrase = ["aceita pets", "aceita pet", "permite animais", "aceita animais"]
    .find(phrase => includesPhrase(normalizedQuery, phrase));
  if (petsPhrase) consume(petsPhrase);

  const furnishedPhrase = ["mobiliado", "mobiliada", "com moveis"]
    .find(phrase => includesPhrase(normalizedQuery, phrase));
  if (furnishedPhrase) consume(furnishedPhrase);

  const moneyText = query
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("pt-BR");
  const amountPattern = String.raw`(\d{1,3}(?:\.\d{3})+|\d+(?:[,.]\d+)?)\s*(mil|k)?`;
  const betweenMatch = moneyText.match(new RegExp(String.raw`\bentre\s+${amountPattern}\s+(?:e|a)\s+${amountPattern}\b`));
  const maximumMatch = betweenMatch ? undefined : moneyText.match(new RegExp(String.raw`\b(?:ate|no maximo|maximo)\s+(?:r\$\s*)?${amountPattern}\b`));
  const minimumMatch = betweenMatch ? undefined : moneyText.match(new RegExp(String.raw`\b(?:a partir de|acima de|minimo|pelo menos)\s+(?:r\$\s*)?${amountPattern}\b`));
  const minimumPriceCents = betweenMatch
    ? parseBrazilianAmount(betweenMatch[1], betweenMatch[2])
    : minimumMatch
      ? parseBrazilianAmount(minimumMatch[1], minimumMatch[2])
      : undefined;
  const maximumPriceCents = betweenMatch
    ? parseBrazilianAmount(betweenMatch[3], betweenMatch[4])
    : maximumMatch
      ? parseBrazilianAmount(maximumMatch[1], maximumMatch[2])
      : undefined;
  if (betweenMatch) consume(normalizeSearchText(betweenMatch[0]));
  if (minimumMatch) consume(normalizeSearchText(minimumMatch[0]));
  if (maximumMatch) consume(normalizeSearchText(maximumMatch[0]));

  const freeTerms = [...new Set(normalizedQuery.split(" "))].filter(term =>
    term.length > 1 && !ignoredTerms.has(term) && !consumedTerms.has(term),
  );

  return {
    ...(purposeMatch ? { purpose: purposeMatch.value } : {}),
    ...(typeMatch ? { type: typeMatch.value } : {}),
    neighborhoodIds: matchedNeighborhoods.map(neighborhood => neighborhood.id),
    ...(minimumPriceCents !== undefined ? { minimumPriceCents } : {}),
    ...(maximumPriceCents !== undefined ? { maximumPriceCents } : {}),
    ...(minimumBedrooms !== undefined ? { minimumBedrooms } : {}),
    ...(minimumBathrooms !== undefined ? { minimumBathrooms } : {}),
    ...(minimumParkingSpots !== undefined ? { minimumParkingSpots } : {}),
    ...(minimumAreaM2 !== undefined ? { minimumAreaM2 } : {}),
    ...(petsPhrase ? { acceptsPets: true } : {}),
    ...(furnishedPhrase ? { furnished: true } : {}),
    freeTerms,
  };
}
