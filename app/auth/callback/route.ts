import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { OAUTH_NEXT_COOKIE, oauthNextCookieOptions } from "@/lib/auth/oauth-flow";
import { syncAuthUser } from "@/lib/auth/sync-user";
import { safeInternalPath } from "@/lib/validation/profile";

function redirectAndClearOAuthCookie(url: URL) {
  const response = NextResponse.redirect(url);
  response.cookies.set(OAUTH_NEXT_COOKIE, "", {
    ...oauthNextCookieOptions(),
    maxAge: 0,
  });
  return response;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const cookieStore = await cookies();
  const next = safeInternalPath(cookieStore.get(OAUTH_NEXT_COOKIE)?.value);

  if (!code) {
    console.error("[auth/callback] Código OAuth ausente.");
    return redirectAndClearOAuthCookie(
      new URL("/entrar?erro=callback", requestUrl.origin),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] Falha ao trocar código pela sessão.", {
      code: error.code,
      message: error.message,
    });
    return redirectAndClearOAuthCookie(
      new URL("/entrar?erro=callback", requestUrl.origin),
    );
  }

  const { data, error: userError } = await supabase.auth.getUser();

  if (userError || !data.user) {
    console.error("[auth/callback] Sessão criada sem usuário válido.", {
      message: userError?.message,
    });
    return redirectAndClearOAuthCookie(
      new URL("/entrar?erro=usuario", requestUrl.origin),
    );
  }

  let user;
  try {
    user = await syncAuthUser(data.user);
  } catch (error) {
    console.error("[auth/callback] Falha ao sincronizar usuário.", {
      message: error instanceof Error ? error.message : String(error),
    });
    return redirectAndClearOAuthCookie(
      new URL("/entrar?erro=sincronizacao", requestUrl.origin),
    );
  }

  if (!user.cityId || !user.phone) {
    const profileUrl = new URL("/perfil", requestUrl.origin);
    profileUrl.searchParams.set("primeiro", "1");
    profileUrl.searchParams.set("next", next);
    return redirectAndClearOAuthCookie(profileUrl);
  }

  return redirectAndClearOAuthCookie(new URL(next, requestUrl.origin));
}
