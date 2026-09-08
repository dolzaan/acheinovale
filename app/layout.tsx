import type { Metadata, Viewport } from "next";
import "@fontsource-variable/plus-jakarta-sans";
import "./globals.css";
import "./city-menu.css";
import "./brand-manual.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";

export const metadata: Metadata = {
  title: "Achei no Vale — Imóveis e fretes em Rio do Sul",
  description:
    "Encontre imóveis para vender ou alugar e freteiros de confiança em Rio do Sul e região.",
  metadataBase: new URL("https://acheinovale.com.br"),
  openGraph: {
    title: "Achei no Vale",
    description: "Encontre perto. Resolva no Vale. Imóveis e fretes em Rio do Sul e região.",
    locale: "pt_BR",
    type: "website",
  },
  applicationName: "Achei no Vale",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Achei no Vale",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fff9ec",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <PwaInstallPrompt />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
