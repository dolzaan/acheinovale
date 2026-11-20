import { NextResponse, type NextRequest } from "next/server";
import { CITY_COOKIE_NAME, normalizeCitySlug } from "@/lib/location/city-preference";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  // Visitante que já escolheu a cidade vai direto para a página dela (home e catálogos
  // sem cidade na URL), em vez da cidade padrão. A cidade entra na URL, então o cache
  // da CDN continua separado por cidade; o redirecionamento não recebe cabeçalho de CDN.
  const { pathname, searchParams } = request.nextUrl;
  const usesSavedCity = pathname === "/" || pathname === "/freteiros"
    || (pathname === "/imoveis" && searchParams.get("regiao") !== "1");
  if (usesSavedCity && !searchParams.has("cidade")
    && (request.method === "GET" || request.method === "HEAD")) {
    const savedSlug = normalizeCitySlug(request.cookies.get(CITY_COOKIE_NAME)?.value);
    if (savedSlug) {
      const url = request.nextUrl.clone();
      url.searchParams.set("cidade", savedSlug);
      return NextResponse.redirect(url, 307);
    }
  }

  const response = await updateSession(request);
  const hasAuthCookie = request.cookies.getAll().some(
    cookie => cookie.name.startsWith("sb-") && cookie.name.includes("-auth-token"),
  );
  const isPublicCatalog = request.nextUrl.pathname === "/"
    || request.nextUrl.pathname === "/imoveis"
    || request.nextUrl.pathname === "/freteiros"
    || /^\/[^/]+\/(?:imoveis(?:\/(?:aluguel|venda)(?:\/[^/]+)?)?|freteiros)$/.test(request.nextUrl.pathname);

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
