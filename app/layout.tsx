import type { Metadata, Viewport } from "next";
import "@fontsource-variable/plus-jakarta-sans";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  title: "AcheiNoVale — Imóveis e fretes em Rio do Sul",
  description:
    "Encontre imóveis para vender ou alugar e freteiros de confiança em Rio do Sul e região.",
  metadataBase: new URL("https://acheinovale.com.br"),
  openGraph: {
    title: "AcheiNoVale",
    description: "Imóveis e fretes perto de você.",
    locale: "pt_BR",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f4f0e7",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
