import "server-only";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function getServerlessDatabaseUrl() {
  const value = process.env.POSTGRES_PRISMA_URL;

  if (!value) {
    return undefined;
  }

  try {
    const url = new URL(value);

    if (url.port === "6543") {
      url.searchParams.set("pgbouncer", "true");
      // Um pool pequeno evita que várias instâncias serverless esgotem as
      // conexões do Supabase. As consultas públicas que compartilham este
      // cliente são executadas em sequência para não disputar esses slots.
      const configuredLimit = Number.parseInt(process.env.PRISMA_CONNECTION_LIMIT || "2", 10);
      const connectionLimit = Number.isFinite(configuredLimit)
        ? Math.min(2, Math.max(1, configuredLimit))
        : 2;
      url.searchParams.set("connection_limit", String(connectionLimit));
      url.searchParams.set("pool_timeout", process.env.PRISMA_POOL_TIMEOUT || "20");
      url.searchParams.set("connect_timeout", process.env.PRISMA_CONNECT_TIMEOUT || "10");
    }

    return url.toString();
  } catch {
    return value;
  }
}

const serverlessDatabaseUrl = getServerlessDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(serverlessDatabaseUrl
      ? { datasources: { db: { url: serverlessDatabaseUrl } } }
      : {}),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
