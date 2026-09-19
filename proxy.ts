import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const response = await updateSession(request);
  const hasAuthCookie = request.cookies.getAll().some(
    cookie => cookie.name.startsWith("sb-") && cookie.name.includes("-auth-token"),
  );
  const isPublicCatalog = request.nextUrl.pathname === "/"
    || request.nextUrl.pathname === "/imoveis"
    || request.nextUrl.pathname === "/freteiros"
    || /^\/[^/]+\/(?:imoveis|freteiros)$/.test(request.nextUrl.pathname);

  if (!hasAuthCookie && isPublicCatalog && (request.method === "GET" || request.method === "HEAD")) {
    const cachePolicy = "public, s-maxage=900, stale-while-revalidate=86400";
    response.headers.set("Vercel-CDN-Cache-Control", cachePolicy);
    response.headers.set("CDN-Cache-Control", cachePolicy);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif)$).*)",
  ],
};
