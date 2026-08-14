import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const authUserId = data?.claims?.sub;

  if (error || typeof authUserId !== "string") {
    return null;
  }

  return prisma.user.findUnique({
    where: { authUserId },
  });
});

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user || user.isBlocked) {
    redirect("/entrar");
  }

  return user;
}

export async function requireAdmin() {
  const user = await requireCurrentUser();

  if (user.role !== "ADMIN") {
    redirect("/");
  }

  return user;
}
