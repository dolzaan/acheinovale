import { describe, expect, it } from "vitest";
import { parsePropertySearch } from "./property-search";

const neighborhoods = [
  { id: "centro", name: "Centro", slug: "centro" },
  { id: "canta-galo", name: "Canta Galo", slug: "canta-galo" },
  { id: "barragem", name: "Barragem", slug: "barragem" },
];

describe("busca de imóveis em linguagem natural", () => {
  it("entende finalidade, tipo, bairro e quartos numa frase comum", () => {
    const intent = parsePropertySearch("quero alugar apartamento no Canta Galo com 2 quartos", neighborhoods);
    expect(intent).toMatchObject({ purpose: "RENT", type: "APARTMENT", neighborhoodIds: ["canta-galo"], minimumBedrooms: 2 });
    expect(intent.freeTerms).toEqual([]);
  });

  it("ignora acentos e maiúsculas no nome do bairro", () => {
    expect(parsePropertySearch("CASA NO CÂNTA GALO", neighborhoods).neighborhoodIds).toEqual(["canta-galo"]);
  });

  it("lê o teto de preço escrito de várias formas", () => {
    expect(parsePropertySearch("casa até 2.500", neighborhoods).maximumPriceCents).toBe(250_000);
    expect(parsePropertySearch("casa até 2500", neighborhoods).maximumPriceCents).toBe(250_000);
    expect(parsePropertySearch("terreno até 300 mil", neighborhoods).maximumPriceCents).toBe(30_000_000);
    expect(parsePropertySearch("casa ate R$ 1.200", neighborhoods).maximumPriceCents).toBe(120_000);
  });

  it("lê faixa de preço com 'entre X e Y'", () => {
    const intent = parsePropertySearch("apartamento entre 1.000 e 2.000", neighborhoods);
    expect(intent.minimumPriceCents).toBe(100_000);
    expect(intent.maximumPriceCents).toBe(200_000);
  });

  it("reconhece pets, mobiliado, vagas e área mínima", () => {
    const intent = parsePropertySearch("casa mobiliada aceita pets 2 vagas 120 m2", neighborhoods);
    expect(intent).toMatchObject({ furnished: true, acceptsPets: true, minimumParkingSpots: 2, minimumAreaM2: 120 });
  });

  it("deixa como texto livre só o que não virou filtro", () => {
    const intent = parsePropertySearch("casa com piscina no centro", neighborhoods);
    expect(intent.type).toBe("HOUSE");
    expect(intent.neighborhoodIds).toEqual(["centro"]);
    expect(intent.freeTerms).toEqual(["piscina"]);
  });

  it("não inventa filtros numa busca vazia", () => {
    expect(parsePropertySearch("   ", neighborhoods)).toEqual({ neighborhoodIds: [], freeTerms: [] });
  });
});
