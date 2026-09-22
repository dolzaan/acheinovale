"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db";
import { revalidatePublicLocations } from "@/lib/listings/public-cache";
import { normalizeNeighborhoodName } from "@/lib/location/neighborhood";
import { slugify } from "@/lib/validation/listing";

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function destination(citySlug: string, result: string) {
  return `/admin/bairros?cidade=${encodeURIComponent(citySlug)}&${result}`;
}

export async function createNeighborhood(formData: FormData) {
  await requireAdmin("/admin/bairros");
  const cityId = field(formData, "cityId");
  const name = normalizeNeighborhoodName(field(formData, "name"));
  const slug = slugify(name);
  const city = await prisma.city.findFirst({ where: { id: cityId, isActive: true }, select: { id: true, slug: true } });
  if (!city || name.length < 2 || name.length > 80 || !slug) redirect("/admin/bairros?erro=dados");

  await prisma.neighborhood.upsert({
    where: { cityId_slug: { cityId: city.id, slug } },
    create: { cityId: city.id, name, slug, needsReview: false },
    update: { name, needsReview: false },
  });

  revalidatePath("/admin/bairros");
  revalidatePublicLocations();
  redirect(destination(city.slug, "concluido=criado"));
}

export async function updateNeighborhood(formData: FormData) {
  await requireAdmin("/admin/bairros");
  const id = field(formData, "id");
  const name = normalizeNeighborhoodName(field(formData, "name"));
  const slug = slugify(name);
  if (!id || name.length < 2 || name.length > 80 || !slug) redirect("/admin/bairros?erro=dados");

  const source = await prisma.neighborhood.findUnique({ where: { id }, include: { city: { select: { slug: true } } } });
  if (!source) redirect("/admin/bairros?erro=nao-encontrado");
  const duplicate = await prisma.neighborhood.findFirst({ where: { cityId: source.cityId, slug, id: { not: source.id } }, select: { id: true } });

  if (duplicate) {
    await prisma.$transaction([
      prisma.property.updateMany({ where: { neighborhoodId: source.id }, data: { neighborhoodId: duplicate.id } }),
      prisma.neighborhood.update({ where: { id: duplicate.id }, data: { name, needsReview: false } }),
      prisma.neighborhood.delete({ where: { id: source.id } }),
    ]);
  } else {
    await prisma.neighborhood.update({ where: { id }, data: { name, slug, needsReview: false } });
  }

  revalidatePath("/admin/bairros");
  revalidatePublicLocations();
  redirect(destination(source.city.slug, "concluido=salvo"));
}
