import { getPublicProperty } from "@/lib/listings/public";
import { brandOnlyCardImage, OG_SIZE, propertyCardImage } from "@/lib/og/property-card";
import { propertyImagePublicUrl } from "@/lib/supabase/storage";

export const runtime = "nodejs";
export const alt = "Imóvel anunciado no Achei no Vale";
export const size = OG_SIZE;
export const contentType = "image/png";

type Props = { params: Promise<{ publicCode: string; slug: string }> };

export default async function PropertyOpenGraphImage({ params }: Props) {
  const { publicCode } = await params;
  const property = await getPublicProperty(publicCode);
  if (!property || property.status !== "ACTIVE") return brandOnlyCardImage();

  return propertyCardImage({
    publicCode: property.publicCode,
    title: property.title,
    purpose: property.purpose,
    type: property.type,
    priceCents: property.priceCents,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    parkingSpots: property.parkingSpots,
    areaM2: property.areaM2,
    neighborhoodName: property.neighborhood.name,
    cityName: property.city.name,
    photoUrl: property.images[0] ? propertyImagePublicUrl(property.images[0].storageKey) : null,
  });
}
