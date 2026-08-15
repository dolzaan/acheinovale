import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";

export const getPublicProperty = cache(async (publicCode: string) => {
  return prisma.property.findUnique({
    where: { publicCode },
    include: {
      city: true,
      neighborhood: true,
      owner: { select: { id: true, name: true, image: true } },
      images: { orderBy: { position: "asc" } },
    },
  });
});

export const getPublicFreighter = cache(async (publicCode: string) => {
  return prisma.freighterProfile.findUnique({
    where: { publicCode },
    include: {
      city: true,
      user: { select: { id: true, name: true, image: true } },
      services: { orderBy: { name: "asc" } },
      reviews: {
        where: { isVisible: true },
        select: { rating: true },
      },
    },
  });
});
