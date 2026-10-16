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
      videos: { orderBy: { position: "asc" } },
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
      images: { orderBy: { position: "asc" } },
      reviews: {
        where: { isVisible: true },
        orderBy: { createdAt: "desc" },
        select: { id: true, rating: true, comment: true, createdAt: true, authorId: true, author: { select: { name: true, image: true } } },
      },
    },
  });
});
