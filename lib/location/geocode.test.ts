import { describe, expect, it, vi } from "vitest";

// O módulo grava no banco, mas estes testes só usam as regras de escolha.
vi.mock("@/lib/db", () => ({ prisma: {} }));

const { pickNeighborhoodResult, shouldGeocode } = await import("./geocode");

const cantaGalo = {
  lat: "-27.2012607",
  lon: "-49.6386078",
  name: "Canta Galo",
  addresstype: "suburb",
  address: { suburb: "Canta Galo", town: "Rio do Sul" },
};
const rioDoSulCenter = {
  lat: "-27.2142",
  lon: "-49.6431",
  name: "Rio do Sul",
  addresstype: "town",
  address: { town: "Rio do Sul" },
};

describe("centro do bairro para o mapa", () => {
  it("usa o bairro encontrado na cidade certa", () => {
    expect(pickNeighborhoodResult([cantaGalo], "Canta Galo", "Rio do Sul")).toEqual({ latitude: -27.2012607, longitude: -49.6386078 });
  });

  it("não marca o centro da cidade quando o bairro não existe no mapa", () => {
    expect(pickNeighborhoodResult([rioDoSulCenter], "Bairro Inexistente", "Rio do Sul")).toBeNull();
  });

  it("não aceita bairro de mesmo nome em outra cidade", () => {
    const otherCity = { ...cantaGalo, address: { suburb: "Canta Galo", town: "Ibirama" } };
    expect(pickNeighborhoodResult([otherCity], "Canta Galo", "Rio do Sul")).toBeNull();
  });

  it("procura de novo só 30 dias depois de não achar o bairro", () => {
    const now = new Date("2026-11-24T00:00:00Z");
    expect(shouldGeocode({ latitude: null, geocodedAt: null }, now)).toBe(true);
    expect(shouldGeocode({ latitude: null, geocodedAt: new Date("2026-11-10T00:00:00Z") }, now)).toBe(false);
    expect(shouldGeocode({ latitude: null, geocodedAt: new Date("2026-10-01T00:00:00Z") }, now)).toBe(true);
    expect(shouldGeocode({ latitude: -27.2, geocodedAt: null }, now)).toBe(false);
  });
});
