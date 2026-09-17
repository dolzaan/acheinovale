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
      url.searchParams.set("connection_limit", "1");
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
