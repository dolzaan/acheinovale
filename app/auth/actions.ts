"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAppUrl } from "@/lib/supabase/config";
import { syncAuthUser } from "@/lib/auth/sync-user";
import { safeInternalPath } from "@/lib/validation/profile";

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function signInWithGoogle(formData: FormData) {
  const next = safeInternalPath(stringValue(formData, "next"), "/perfil");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${getAppUrl()}/auth/callback?next=${encodeURIComponent(next)}`,
      queryParams: {
        access_type: "offline",
        prompt: "select_account",
      },
    },
  });

  if (error || !data.url) {
    redirect("/entrar?erro=google");
  }

  redirect(data.url);
}

export async function signInWithPassword(formData: FormData) {
  const email = stringValue(formData, "email").toLowerCase();
  const password = stringValue(formData, "password");

  if (!email || !password) {
    redirect("/entrar?erro=credenciais");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    redirect("/entrar?erro=credenciais");
  }

  await syncAuthUser(data.user);
  redirect("/perfil");
}

export async function signUpWithPassword(formData: FormData) {
  const name = stringValue(formData, "name");
  const email = stringValue(formData, "email").toLowerCase();
  const password = stringValue(formData, "password");

  if (!name || !email || password.length < 8) {
    redirect("/cadastro?erro=dados");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
      emailRedirectTo: `${getAppUrl()}/auth/callback`,
    },
  });

  if (error) {
    redirect("/cadastro?erro=cadastro");
  }

  if (data.user && data.session) {
    await syncAuthUser(data.user);
    redirect("/perfil");
  }

  redirect("/entrar?cadastro=confirme-email");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
