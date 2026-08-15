import "server-only";

export const OAUTH_NEXT_COOKIE = "acheinovale-oauth-next";

export function oauthNextCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/auth/callback",
    maxAge: 10 * 60,
  };
}
