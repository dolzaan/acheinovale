"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db";
import { freighterUrl, propertyUrl } from "@/lib/listings/urls";
import { checkRateLimit } from "@/lib/security/rate-limit";

export type FavoriteKind = "imovel" | "freteiro";

async function listingPath(kind: FavoriteKind, id: string) {
  if (kind === "imovel") {
    const property = await prisma.property.findFirst({ where: { id, status: "ACTIVE" }, select: { publicCode: true, slug: true } });
    return property ? propertyUrl(property) : null;
  }
  const profile = await prisma.freighterProfile.findFirst({ where: { id, status: "ACTIVE" }, select: { publicCode: true, slug: true } });
  return profile ? freighterUrl(profile) : null;
}

export async function toggleFavorite(kind: FavoriteKind, id: string) {
  const path = await listingPath(kind, id);
  if (!path) redirect("/favoritos");
  const user = await requireCurrentUser(path);

  const rateLimit = await checkRateLimit({ scope: "favoritos", identifier: user.id, limit: 60, windowSeconds: 60 * 60 });
  if (!rateLimit.allowed) redirect(path);

  const target = kind === "imovel" ? { propertyId: id } : { freighterProfileId: id };
  const existing = await prisma.favorite.findFirst({ where: { userId: user.id, ...target }, select: { id: true } });
  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
  } else {
    // A restrição única por usuário e item evita duplicidade em cliques simultâneos.
    await prisma.favorite.create({ data: { userId: user.id, ...target } }).catch(() => undefined);
  }

  revalidatePath(path);
  revalidatePath("/favoritos");
}
