import "server-only";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { prisma } from "@/lib/db";

export async function syncAuthUser(authUser: SupabaseUser) {
  if (!authUser.email) {
    throw new Error("A conta autenticada não possui e-mail.");
  }

  const metadata = authUser.user_metadata ?? {};
  const name =
    typeof metadata.full_name === "string"
      ? metadata.full_name
      : typeof metadata.name === "string"
        ? metadata.name
        : null;
  const image = typeof metadata.avatar_url === "string" ? metadata.avatar_url : null;

  const email = authUser.email.toLowerCase();
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ authUserId: authUser.id }, { email }],
    },
  });

  const data = {
    authUserId: authUser.id,
    email,
    emailVerifiedAt: authUser.email_confirmed_at
      ? new Date(authUser.email_confirmed_at)
      : null,
    name,
    image,
    lastLoginAt: new Date(),
  };

  if (existingUser) {
    return prisma.user.update({
      where: { id: existingUser.id },
      data,
    });
  }

  return prisma.user.create({
    data,
  });
}
