import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AcheiNoVale — Imóveis e fretes",
    short_name: "AcheiNoVale",
    description:
      "Encontre imóveis para vender ou alugar e freteiros de confiança em Rio do Sul e região.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#fffefa",
    theme_color: "#173f35",
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
