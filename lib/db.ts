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
      // Uma única conexão fazia as consultas públicas paralelas disputarem o
      // mesmo slot até o P2024. Três conexões mantêm o consumo controlado e
      // ainda permitem que páginas públicas e autenticação avancem juntas.
      url.searchParams.set("connection_limit", process.env.PRISMA_CONNECTION_LIMIT || "3");
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
