import { describe, expect, it } from "vitest";
import { floodLevelInputValue, formatFloodLevel, parseFloodLevel } from "./flood-level";

describe("cota de enchente", () => {
  it("entende o jeito que as pessoas escrevem a cota", () => {
    expect(parseFloodLevel("12,5")).toEqual({ valid: true, value: 1250 });
    expect(parseFloodLevel("12.50")).toEqual({ valid: true, value: 1250 });
    expect(parseFloodLevel("13 m")).toEqual({ valid: true, value: 1300 });
  });

  it("é opcional: em branco não impede publicar", () => {
    expect(parseFloodLevel("  ")).toEqual({ valid: true, value: null });
  });

  it("recusa valores que não são uma cota de rio", () => {
    expect(parseFloodLevel("0,5").valid).toBe(false);
    expect(parseFloodLevel("45").valid).toBe(false);
    expect(parseFloodLevel("não alaga").valid).toBe(false);
    expect(parseFloodLevel("12,345").valid).toBe(false);
  });

  it("mostra a cota em metros, como se fala em Rio do Sul", () => {
    expect(formatFloodLevel(1250)).toBe("12,5 m");
    expect(formatFloodLevel(1300)).toBe("13 m");
  });

  it("volta ao formulário de edição do jeito que foi digitado", () => {
    expect(floodLevelInputValue(1250)).toBe("12,5");
    expect(floodLevelInputValue(null)).toBe("");
  });
});
