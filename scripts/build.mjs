import { spawnSync } from "node:child_process";

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (process.env.VERCEL_ENV === "production") {
  const productionMigrations = [
    "prisma/migrations/20260909195500_add_neighborhood_review/migration.sql",
    "prisma/migrations/20260910173000_security_hardening/migration.sql",
  ];

  for (const migration of productionMigrations) {
    console.log(`[build] Aplicando migração idempotente: ${migration}`);
    run("prisma", [
      "db",
      "execute",
      "--file",
      migration,
      "--schema",
      "prisma/schema.prisma",
    ]);
  }
}

run("prisma", ["generate"]);
run("next", ["build"]);
