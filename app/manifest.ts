import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Achei no Vale — Imóveis e fretes",
    short_name: "Achei no Vale",
    description:
      "Encontre imóveis para vender ou alugar e freteiros de confiança em Rio do Sul e região.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#fff9ec",
    theme_color: "#1d402d",
    orientation: "any",
    categories: ["lifestyle", "business"],
    lang: "pt-BR",
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
