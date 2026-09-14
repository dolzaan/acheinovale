"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db";

export async function reviewReport(formData: FormData) {
  await requireAdmin("/admin/denuncias");
  const idValue = formData.get("id");
  const intentValue = formData.get("intent");
  const id = typeof idValue === "string" ? idValue : "";
  const status = intentValue === "resolve" ? "RESOLVED" as const : intentValue === "dismiss" ? "DISMISSED" as const : null;
  if (!id || !status) redirect("/admin/denuncias?erro=acao");
  await prisma.report.update({ where: { id }, data: { status } });
  revalidatePath("/admin/denuncias");
  redirect("/admin/denuncias?concluido=1");
}
