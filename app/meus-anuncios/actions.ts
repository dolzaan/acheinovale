"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePropertyOwner, requireFreighterOwner } from "@/lib/listings/authorization";
import { AUTO_PAUSE_NOTE } from "@/lib/listings/availability";
import { revalidatePublicListings } from "@/lib/listings/public-cache";

export async function pauseProperty(formData: FormData) {
  const id = String(formData.get("id") || "");
  const { property } = await requirePropertyOwner(id);
  if (property.status !== "ACTIVE" && property.status !== "PAUSED") {
    throw new Error("Este anúncio ainda não pode ser pausado ou reativado.");
  }
  if (property.status === "PAUSED" && !property.publishedAt) {
    throw new Error("Este anúncio precisa ser aprovado antes de ser ativado.");
  }
  const reactivating = property.status === "PAUSED";
  await prisma.property.update({
    where: { id },
    data: reactivating
      ? {
        status: "ACTIVE",
        // Reativar é uma confirmação de que o imóvel continua disponível.
        availabilityConfirmedAt: new Date(),
        ...(property.moderationNote === AUTO_PAUSE_NOTE ? { moderationNote: null } : {}),
      }
      : { status: "PAUSED" },
  });
  revalidatePublicListings();
  revalidatePath("/meus-anuncios");
}

export async function confirmPropertyAvailability(formData: FormData) {
  const id = String(formData.get("id") || "");
  const { property } = await requirePropertyOwner(id);
  if (property.status !== "ACTIVE") throw new Error("Somente anúncios ativos podem ser confirmados.");
  await prisma.property.update({ where: { id }, data: { availabilityConfirmedAt: new Date() } });
  revalidatePath("/meus-anuncios");
}

export async function archiveProperty(formData: FormData) {
  const id = String(formData.get("id") || "");
  await requirePropertyOwner(id);
  await prisma.property.update({ where: { id }, data: { status: "ARCHIVED" } });
  revalidatePublicListings();
  revalidatePath("/meus-anuncios");
}

export async function pauseFreighter(formData: FormData) {
  const id = String(formData.get("id") || "");
  const { profile } = await requireFreighterOwner(id);
  if (profile.status !== "ACTIVE" && profile.status !== "PAUSED") {
    throw new Error("Este perfil ainda não pode ser pausado ou reativado.");
  }
  if (profile.status === "PAUSED" && !profile.publishedAt) {
    throw new Error("Este perfil precisa ser aprovado antes de ser ativado.");
  }
  const nextStatus = profile.status === "PAUSED" ? "ACTIVE" : "PAUSED";
  await prisma.freighterProfile.update({ where: { id }, data: { status: nextStatus } });
  revalidatePublicListings();
  revalidatePath("/meus-anuncios");
}
