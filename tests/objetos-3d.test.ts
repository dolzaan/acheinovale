import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { OBJETOS_3D } from "@/components/objeto-3d";

// Cada objeto que o código pode pedir precisa existir em public/3d,
// senão a página mostra uma imagem quebrada no lugar do objeto.
describe("objetos 3D", () => {
  it.each(OBJETOS_3D)("%s tem imagem publicada", nome => {
    expect(existsSync(join(__dirname, "..", "public/3d", `${nome}.webp`))).toBe(true);
  });
});
