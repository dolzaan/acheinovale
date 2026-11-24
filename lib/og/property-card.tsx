import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import type { PropertyPurpose, PropertyType } from "@prisma/client";
import { formatArea, formatCount } from "@/lib/format";

// Cartão que aparece quando o link do anúncio é colado no WhatsApp, Facebook etc.
export const OG_SIZE = { width: 1200, height: 630 };

const PHOTO_WIDTH = 620;
const GREEN = "#1d402d";
const GOLD = "#e4a030";
const CREAM = "#fff9ec";
const TERRACOTTA = "#a85527";
const CACHE_HEADERS = { "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400" };

const propertyTypes: Record<PropertyType, string> = {
  HOUSE: "Casa",
  APARTMENT: "Apartamento",
  STUDIO: "Kitnet / Studio",
  LAND: "Terreno",
  COMMERCIAL_ROOM: "Sala comercial",
  WAREHOUSE: "Galpão",
  OTHER: "Imóvel",
};

export type PropertyCardData = {
  publicCode: string;
  title: string;
  purpose: PropertyPurpose;
  type: PropertyType;
  priceCents: number;
  bedrooms: number | null;
  bathrooms: number | null;
  parkingSpots: number | null;
  areaM2: number | { toString(): string } | null;
  neighborhoodName: string;
  cityName: string;
  /** URL pública da primeira foto; nulo quando o anúncio não tem fotos. */
  photoUrl: string | null;
};

function formatPrice(priceCents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(priceCents / 100);
}

function truncate(text: string, maximum: number) {
  return text.length > maximum ? `${text.slice(0, maximum - 1).trimEnd()}…` : text;
}

async function brandAsset(name: string) {
  const file = await readFile(join(process.cwd(), "public", "brand", name));
  return `data:image/png;base64,${file.toString("base64")}`;
}

/** As fotos ficam em WebP, que o gerador de imagem não lê: converte para JPEG já no recorte certo. */
async function coverPhoto(url: string) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) return null;
    const jpeg = await sharp(Buffer.from(await response.arrayBuffer()))
      .resize(PHOTO_WIDTH, OG_SIZE.height, { fit: "cover" })
      .jpeg({ quality: 80 })
      .toBuffer();
    return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
  } catch (error) {
    console.warn("[og:imovel] Não foi possível carregar a foto de capa.", {
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/** Só a marca, para anúncio inexistente, pendente ou recusado: não revela nada do imóvel. */
export async function brandOnlyCardImage() {
  const logo = await brandAsset("logo-green.png");
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: CREAM, gap: 28 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} width={558} height={253} alt="" />
        <div style={{ display: "flex", fontSize: 34, color: GREEN }}>Imóveis e fretes no Alto Vale do Itajaí</div>
      </div>
    ),
    { ...OG_SIZE, headers: CACHE_HEADERS },
  );
}

export async function propertyCardImage(property: PropertyCardData) {
  const [logo, photo] = await Promise.all([
    brandAsset("logo-green.png"),
    property.photoUrl ? coverPhoto(property.photoUrl) : Promise.resolve(null),
  ]);
  const goldLogo = photo ? null : await brandAsset("logo-gold.png");
  const facts = [
    property.bedrooms !== null ? formatCount(property.bedrooms, "quarto", "quartos") : null,
    property.bathrooms !== null ? formatCount(property.bathrooms, "banheiro", "banheiros") : null,
    property.parkingSpots ? formatCount(property.parkingSpots, "vaga", "vagas") : null,
    property.areaM2 ? formatArea(property.areaM2) : null,
  ].filter((fact): fact is string => Boolean(fact)).slice(0, 3);

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: CREAM }}>
        <div style={{ width: PHOTO_WIDTH, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: GREEN }}>
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} width={PHOTO_WIDTH} height={OG_SIZE.height} alt="" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={goldLogo!} width={440} height={199} alt="" />
          )}
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "44px 48px 40px", borderTop: `10px solid ${GOLD}` }}>
          <div style={{ display: "flex", alignSelf: "flex-start", padding: "8px 18px", borderRadius: 999, background: property.purpose === "RENT" ? TERRACOTTA : GREEN, color: "#fff", fontSize: 24, fontWeight: 700 }}>
            {`${property.purpose === "RENT" ? "Aluguel" : "Venda"} · ${propertyTypes[property.type]}`}
          </div>

          <div style={{ display: "flex", marginTop: 26, fontSize: 40, lineHeight: 1.18, fontWeight: 700, color: "#000004" }}>
            {truncate(property.title, 60)}
          </div>
          <div style={{ display: "flex", marginTop: 14, fontSize: 27, color: TERRACOTTA }}>
            {truncate(`${property.neighborhoodName}, ${property.cityName}`, 32)}
          </div>

          <div style={{ display: "flex", alignItems: "baseline", marginTop: "auto", gap: 10 }}>
            <div style={{ display: "flex", fontSize: 58, fontWeight: 700, color: GREEN }}>{formatPrice(property.priceCents)}</div>
            {property.purpose === "RENT" ? <div style={{ display: "flex", fontSize: 28, color: GREEN }}>/mês</div> : null}
          </div>
          {facts.length ? (
            <div style={{ display: "flex", marginTop: 8, fontSize: 25, color: "#333" }}>{facts.join("  ·  ")}</div>
          ) : null}

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 26, paddingTop: 20, borderTop: "2px solid rgba(29, 64, 45, 0.15)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo} width={176} height={80} alt="" />
            <div style={{ display: "flex", fontSize: 22, color: GREEN }}>{`Código ${property.publicCode.toUpperCase()}`}</div>
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, headers: CACHE_HEADERS },
  );
}
