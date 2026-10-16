import "server-only";

/** A Vercel envia "Authorization: Bearer $CRON_SECRET" quando a variável está configurada. */
export function isAuthorizedCronRequest(request: Request) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret) && request.headers.get("authorization") === `Bearer ${secret}`;
}
