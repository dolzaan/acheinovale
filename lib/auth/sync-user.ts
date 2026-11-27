import "server-only";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { prisma } from "@/lib/db";

/**
 * Uma conta já existente só pode ser assumida pelo e-mail quando quem entra provou ser dono
 * dele: login pelo Google com e-mail confirmado. Sem isso, alguém que criasse uma sessão
 * no Supabase com o e-mail de outra pessoa herdaria a conta dela (inclusive a de admin).
 */
export function canLinkExistingAccountByEmail(authUser: Pick<SupabaseUser, "email" | "email_confirmed_at" | "identities">) {
  if (!authUser.email || !authUser.email_confirmed_at) return false;
  const email = authUser.email.toLowerCase();
  return Boolean(authUser.identities?.some(identity =>
    identity.provider === "google"
    && typeof identity.identity_data?.email === "string"
    && identity.identity_data.email.toLowerCase() === email,
  ));
}

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
  const googleIdentity = authUser.identities?.find((identity) => identity.provider === "google");
  const authProvider = googleIdentity ? "google" : authUser.app_metadata?.provider ?? null;
  const googleSubject = googleIdentity?.identity_data?.sub;
  const providerId = typeof googleSubject === "string" ? googleSubject : googleIdentity?.identity_id ?? authUser.id;

  const email = authUser.email.toLowerCase();
  const existingUser =
    (await prisma.user.findUnique({ where: { authUserId: authUser.id } }))
    ?? (await prisma.user.findUnique({ where: { email } }));

  if (existingUser && existingUser.authUserId !== authUser.id && !canLinkExistingAccountByEmail(authUser)) {
    throw new Error("Este e-mail já pertence a outra conta. Entre com o Google para acessá-la.");
  }

  const data = {
    authUserId: authUser.id,
    authProvider,
    providerId,
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
      data: {
        ...data,
        // Alterações feitas pelo próprio usuário não são sobrescritas no próximo login.
        name: existingUser.name ?? name,
        image: existingUser.image ?? image,
      },
    });
  }

  return prisma.user.create({
    data,
  });
}
