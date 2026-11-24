"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export async function unsubscribeWeeklySummary(formData: FormData) {
  const token = formData.get("token");
  if (typeof token === "string" && token) {
    await prisma.user.updateMany({ where: { summaryUnsubscribeToken: token }, data: { weeklySummaryOptOut: true } });
  }
  redirect("/resumo/cancelar?concluido=1");
}
