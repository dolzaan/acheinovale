import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";

function digest(value: string) {
  return createHash("sha256").update(value).digest();
}

/** A Vercel envia "Authorization: Bearer $CRON_SECRET" quando a variável está configurada. */
export function isAuthorizedCronRequest(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  // Compara os hashes em tempo constante para o tempo de resposta não revelar o segredo.
  return timingSafeEqual(digest(request.headers.get("authorization") ?? ""), digest(`Bearer ${secret}`));
}
