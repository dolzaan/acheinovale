import "server-only";
import { prisma } from "@/lib/db";
import { requireCurrentUser } from "@/lib/auth/current-user";

export async function requirePropertyOwner(propertyId: string) {
  const user = await requireCurrentUser(`/meus-anuncios`);
  const property = await prisma.property.findUnique({ where: { id: propertyId } });

  if (!property || (property.ownerId !== user.id && user.role !== "ADMIN")) {
    throw new Error("Você não tem autorização para alterar este anúncio.");
  }

  return { user, property };
}

export async function requireFreighterOwner(profileId: string) {
  const user = await requireCurrentUser(`/meus-anuncios`);
  const profile = await prisma.freighterProfile.findUnique({ where: { id: profileId } });

  if (!profile || (profile.userId !== user.id && user.role !== "ADMIN")) {
    throw new Error("Você não tem autorização para alterar este serviço.");
  }

  return { user, profile };
}
