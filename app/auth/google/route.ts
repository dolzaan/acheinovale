import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncAuthUser } from "@/lib/auth/sync-user";
import { safeInternalPath } from "@/lib/validation/profile";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const requestHost = (
    request.headers.get("x-forwarded-host") ?? request.headers.get("host")
  )?.split(",")[0]?.trim();

  if (origin && requestHost) {
    try {
      if (new URL(origin).host !== requestHost) {
        return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
    }
  }

  let next = "/perfil";
  try {
    const body = (await request.json()) as { next?: unknown };
    next = safeInternalPath(typeof body.next === "string" ? body.next : null);
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });
  }

  try {
    const user = await syncAuthUser(data.user);

    if (!user.cityId || !user.phone) {
      const params = new URLSearchParams({ primeiro: "1", next });
      return NextResponse.json({ redirectTo: `/perfil?${params.toString()}` });
    }

    return NextResponse.json({ redirectTo: next });
  } catch (syncError) {
    console.error("[auth/google] Falha ao sincronizar usuário.", {
      message: syncError instanceof Error ? syncError.message : String(syncError),
    });
    return NextResponse.json({ error: "Falha ao sincronizar usuário." }, { status: 500 });
  }
}
