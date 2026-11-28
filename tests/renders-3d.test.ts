import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { RENDERS_3D } from "@/components/render-3d";

// Cada objeto que o código pode pedir precisa existir em public/renders,
// senão a home mostra uma imagem quebrada no lugar do objeto.
describe("renders 3D", () => {
  it.each(Object.keys(RENDERS_3D))("%s tem imagem publicada", nome => {
    expect(existsSync(join(__dirname, "..", "public/renders", `${nome}.webp`))).toBe(true);
  });
});
