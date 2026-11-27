import { describe, expect, it } from "vitest";
import { ownStorageKeys } from "./media-ownership";

const DONO = "11111111-1111-4111-8111-111111111111";
const OUTRO = "22222222-2222-4222-8222-222222222222";

describe("arquivos que um anunciante pode apagar", () => {
  it("mantém só os arquivos da pasta de quem pediu", () => {
    expect(ownStorageKeys([
      `${DONO}/properties/a1.jpg`,
      `${OUTRO}/properties/b2.jpg`,
      `${DONO}/freighters/c3.webp`,
    ], DONO)).toEqual([`${DONO}/properties/a1.jpg`, `${DONO}/freighters/c3.webp`]);
  });

  it("não deixa sair da própria pasta com ../", () => {
    expect(ownStorageKeys([`${DONO}/../${OUTRO}/properties/b2.jpg`], DONO)).toEqual([]);
  });

  it("não aceita prefixo parecido nem a pasta inteira", () => {
    expect(ownStorageKeys([`${DONO}extra/properties/a.jpg`, `${DONO}/`, DONO], DONO)).toEqual([]);
  });

  it("sem usuário identificado, não apaga nada", () => {
    expect(ownStorageKeys([`${DONO}/properties/a1.jpg`], "")).toEqual([]);
  });
});
