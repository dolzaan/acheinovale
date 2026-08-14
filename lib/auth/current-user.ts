import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const getCurrentUser = cache(async () => {
  if (!isSupabaseConfigured()) {
    return null;
  }

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

export async function requireCurrentUser(nextPath = "/perfil") {
  const user = await getCurrentUser();

  if (!user || user.isBlocked) {
    redirect(`/entrar?next=${encodeURIComponent(nextPath)}`);
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
