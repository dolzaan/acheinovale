import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncAuthUser } from "@/lib/auth/sync-user";
import { safeInternalPath } from "@/lib/validation/profile";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = safeInternalPath(requestUrl.searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(new URL("/entrar?erro=callback", requestUrl.origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/entrar?erro=callback", requestUrl.origin));
  }

  const { data, error: userError } = await supabase.auth.getUser();

  if (userError || !data.user) {
    return NextResponse.redirect(new URL("/entrar?erro=usuario", requestUrl.origin));
  }

  let user;
  try {
    user = await syncAuthUser(data.user);
  } catch {
    return NextResponse.redirect(new URL("/entrar?erro=sincronizacao", requestUrl.origin));
  }

  if (!user.cityId || !user.phone) {
    const profileUrl = new URL("/perfil", requestUrl.origin);
    profileUrl.searchParams.set("primeiro", "1");
    profileUrl.searchParams.set("next", next);
    return NextResponse.redirect(profileUrl);
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
