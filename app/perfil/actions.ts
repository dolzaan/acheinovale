"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { normalizeBrazilianPhone, safeInternalPath } from "@/lib/validation/profile";

function value(formData: FormData, key: string) {
  const field = formData.get(key);
  return typeof field === "string" ? field.trim() : "";
}

export async function updateProfile(formData: FormData) {
  const user = await requireCurrentUser("/perfil");
  const name = value(formData, "name");
  const cityId = value(formData, "cityId");
  const phone = normalizeBrazilianPhone(value(formData, "phone"));
  const next = safeInternalPath(value(formData, "next"), "/perfil?salvo=1");

  if (name.length < 2 || name.length > 100 || !phone || !cityId) {
    redirect(`/perfil?erro=dados&next=${encodeURIComponent(next)}`);
  }

  const city = await prisma.city.findFirst({ where: { id: cityId, isActive: true }, select: { id: true } });
  if (!city) redirect(`/perfil?erro=cidade&next=${encodeURIComponent(next)}`);

  await prisma.user.update({
    where: { id: user.id },
    data: { name, phone, cityId: city.id },
  });

  revalidatePath("/perfil");
  revalidatePath("/");
  redirect(next === "/perfil" ? "/perfil?salvo=1" : next);
}
