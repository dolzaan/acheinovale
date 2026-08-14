"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePropertyOwner, requireFreighterOwner } from "@/lib/listings/authorization";

export async function pauseProperty(formData: FormData) {
  const id = String(formData.get("id") || "");
  const { property } = await requirePropertyOwner(id);
  const nextStatus = property.status === "PAUSED" ? "ACTIVE" : "PAUSED";
  await prisma.property.update({ where: { id }, data: { status: nextStatus } });
  revalidatePath("/meus-anuncios");
}

export async function archiveProperty(formData: FormData) {
  const id = String(formData.get("id") || "");
  await requirePropertyOwner(id);
  await prisma.property.update({ where: { id }, data: { status: "ARCHIVED" } });
  revalidatePath("/meus-anuncios");
}

export async function pauseFreighter(formData: FormData) {
  const id = String(formData.get("id") || "");
  const { profile } = await requireFreighterOwner(id);
  const nextStatus = profile.status === "PAUSED" ? "ACTIVE" : "PAUSED";
  await prisma.freighterProfile.update({ where: { id }, data: { status: nextStatus } });
  revalidatePath("/meus-anuncios");
}
