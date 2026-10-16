"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db";
import { revalidatePublicListings } from "@/lib/listings/public-cache";
import { freighterUrl } from "@/lib/listings/urls";

export async function setReviewVisibility(formData: FormData) {
  await requireAdmin("/admin/avaliacoes");
  const id = formData.get("id");
  const visible = formData.get("visible");
  if (typeof id !== "string" || !id || (visible !== "1" && visible !== "0")) redirect("/admin/avaliacoes?erro=1");

  const review = await prisma.review.update({
    where: { id },
    data: { isVisible: visible === "1" },
    include: { profile: { select: { publicCode: true, slug: true } } },
  });

  revalidatePublicListings();
  revalidatePath(freighterUrl(review.profile));
  revalidatePath("/admin/avaliacoes");
  redirect("/admin/avaliacoes?concluido=1");
}
