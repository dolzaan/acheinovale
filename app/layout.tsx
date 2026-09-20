import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "@fontsource-variable/plus-jakarta-sans";
import "./globals.css";
import "./city-menu.css";
import "./brand-manual.css";
import "./brand-experience.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { AccountSessionProvider } from "@/components/account-session-provider";

const organizationStructuredData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/brand/logo-green-compact.svg`,
  areaServed: {
    "@type": "AdministrativeArea",
    name: "Alto Vale do Itajaí, Santa Catarina",
  },
};

const websiteStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  inLanguage: "pt-BR",
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_URL}/buscar?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export const metadata: Metadata = {
  title: "Achei no Vale — Imóveis e fretes no Alto Vale do Itajaí",
  description:
    "Encontre imóveis para vender ou alugar e serviços de frete no Alto Vale do Itajaí.",
  metadataBase: new URL(SITE_URL),
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
  openGraph: {
    title: "Achei no Vale",
    description: "Encontre perto. Resolva no Vale. Imóveis e fretes no Alto Vale do Itajaí.",
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "pt_BR",
    type: "website",
  },
  applicationName: SITE_NAME,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: SITE_NAME,
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
        <Script
          id="organization-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationStructuredData) }}
        />
        <Script
          id="website-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteStructuredData) }}
        />
        <AccountSessionProvider>{children}</AccountSessionProvider>
        <PwaInstallPrompt />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
