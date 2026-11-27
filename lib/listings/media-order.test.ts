import { describe, expect, it } from "vitest";
import { firstPhoto, moveMediaItem, reorderMediaItem } from "./media-order";

type Item = { id: string; kind: "image" | "video" };
const helpers = { key: (item: Item) => item.id, isImage: (item: Item) => item.kind === "image" };
const ids = (list: Item[]) => list.map(item => item.id);
const foto1 = { id: "foto1", kind: "image" } as const;
const foto2 = { id: "foto2", kind: "image" } as const;
const video = { id: "video", kind: "video" } as const;

describe("ordem das mídias do anúncio", () => {
  it("a seta da segunda foto para a esquerda a transforma em capa", () => {
    const next = moveMediaItem([foto1, foto2], "foto2", -1, helpers);
    expect(ids(next)).toEqual(["foto2", "foto1"]);
    expect(firstPhoto(next, helpers)?.id).toBe("foto2");
  });

  it("a seta da capa para a direita passa a capa para a foto seguinte", () => {
    expect(ids(moveMediaItem([foto1, foto2], "foto1", 1, helpers))).toEqual(["foto2", "foto1"]);
  });

  it("o vídeo não pode passar para a frente da primeira foto", () => {
    expect(ids(moveMediaItem([foto1, video, foto2], "video", -1, helpers))).toEqual(["foto1", "video", "foto2"]);
    expect(ids(reorderMediaItem([foto1, foto2, video], "video", "foto1", helpers))).toEqual(["foto1", "foto2", "video"]);
  });

  it("arrastar uma foto para a primeira posição a torna capa", () => {
    expect(ids(reorderMediaItem([foto1, video, foto2], "foto2", "foto1", helpers))).toEqual(["foto2", "foto1", "video"]);
  });

  it("anúncio só com vídeo continua podendo ser reordenado", () => {
    expect(ids(moveMediaItem([video], "video", 1, helpers))).toEqual(["video"]);
  });
});
