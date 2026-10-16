"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { notifyAdminsPending, sendLater } from "@/lib/email/notifications";
import { requirePropertyOwner } from "@/lib/listings/authorization";
import { parsePropertyDetails } from "@/lib/listings/property-details";
import { revalidatePublicListings } from "@/lib/listings/public-cache";
import { propertyUrl } from "@/lib/listings/urls";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { propertySlug } from "@/lib/validation/listing";

export async function updatePropertyDetails(propertyId: string, formData: FormData) {
  const { user, property } = await requirePropertyOwner(propertyId);
  const editPath = `/meus-anuncios/${propertyId}/editar`;
  if (property.status === "ARCHIVED") redirect(`${editPath}?erro=permissao`);

  const rateLimit = await checkRateLimit({ scope: "editar-imovel", identifier: user.id, limit: 20, windowSeconds: 60 * 60 });
  if (!rateLimit.allowed) redirect(`${editPath}?erro=limite`);

  const parsed = await parsePropertyDetails(formData);
  if (!parsed.ok) redirect(`${editPath}?erro=${parsed.error}`);
  const { neighborhood, privateAddressData, ...details } = parsed.details;

  // Só mudanças no que aparece publicamente exigem nova moderação.
  const publicContentChanged =
    details.title !== property.title ||
    details.description !== property.description ||
    details.purpose !== property.purpose ||
    details.type !== property.type ||
    details.priceCents !== property.priceCents ||
    details.whatsapp !== property.whatsapp ||
    details.bedrooms !== property.bedrooms ||
    details.bathrooms !== property.bathrooms ||
    details.parkingSpots !== property.parkingSpots ||
    neighborhood.id !== property.neighborhoodId;
  const needsReview = publicContentChanged || property.status === "REJECTED";

  const updated = await prisma.property.update({
    where: { id: propertyId },
    data: {
      ...details,
      slug: propertySlug(details.title, neighborhood.name, neighborhood.city.name),
      cityId: neighborhood.cityId,
      neighborhoodId: neighborhood.id,
      privateAddressData: privateAddressData ?? Prisma.DbNull,
      availabilityConfirmedAt: new Date(),
      ...(needsReview ? { status: "PENDING" as const, moderationNote: null, moderatedAt: null, moderatedById: null } : {}),
    },
  });

  revalidatePublicListings();
  revalidatePath("/meus-anuncios");
  revalidatePath(propertyUrl(property));
  revalidatePath(propertyUrl(updated));
  if (needsReview) sendLater(() => notifyAdminsPending({ what: "Imóvel alterado e enviado para nova análise", title: details.title, path: "/admin/anuncios?tipo=imoveis&status=PENDING" }));
  redirect(`${editPath}?salvo=1${needsReview ? "&revisao=1" : ""}`);
}
