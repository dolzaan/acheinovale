import "server-only";

import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";

type RateLimitOptions = {
  scope: string;
  identifier: string;
  limit: number;
  windowSeconds: number;
};

type RateLimitRow = {
  count: number;
  resetAt: Date;
};

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

export async function checkRateLimit({
  scope,
  identifier,
  limit,
  windowSeconds,
}: RateLimitOptions): Promise<RateLimitResult> {
  const key = createHash("sha256").update(`${scope}:${identifier}`).digest("hex");
  const resetAt = new Date(Date.now() + windowSeconds * 1000);

  try {
    const rows = await prisma.$queryRaw<RateLimitRow[]>`
      INSERT INTO "limites_requisicao" ("chave", "quantidade", "reinicia_em", "atualizado_em")
      VALUES (${key}, 1, ${resetAt}, CURRENT_TIMESTAMP)
      ON CONFLICT ("chave") DO UPDATE SET
        "quantidade" = CASE
          WHEN "limites_requisicao"."reinicia_em" <= CURRENT_TIMESTAMP THEN 1
          ELSE "limites_requisicao"."quantidade" + 1
        END,
        "reinicia_em" = CASE
          WHEN "limites_requisicao"."reinicia_em" <= CURRENT_TIMESTAMP THEN EXCLUDED."reinicia_em"
          ELSE "limites_requisicao"."reinicia_em"
        END,
        "atualizado_em" = CURRENT_TIMESTAMP
      RETURNING "quantidade" AS "count", "reinicia_em" AS "resetAt"
    `;

    const row = rows[0];
    if (!row) return { allowed: false, retryAfterSeconds: windowSeconds };

    return {
      allowed: row.count <= limit,
      retryAfterSeconds: Math.max(1, Math.ceil((row.resetAt.getTime() - Date.now()) / 1000)),
    };
  } catch (error) {
    console.error("[security/rate-limit] Falha ao verificar limite.", {
      scope,
      message: error instanceof Error ? error.message : String(error),
    });

    return {
      allowed: process.env.VERCEL_ENV !== "production",
      retryAfterSeconds: windowSeconds,
    };
  }
}
