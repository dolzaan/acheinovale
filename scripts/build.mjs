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
    "prisma/migrations/20260914204000_freighter_metrics/migration.sql",
    "prisma/migrations/20260922120000_public_catalog_performance/migration.sql",
    "prisma/migrations/20260922143000_neighborhood_catalog/migration.sql",
    // Precisa vir depois de security_hardening, que recria a mesma política sem a exigência para freteiros.
    "prisma/migrations/20261015120000_freighter_upload_grants/migration.sql",
    "prisma/migrations/20261016120000_property_lifecycle/migration.sql",
    "prisma/migrations/20261017120000_emails_alerts_contacts/migration.sql",
    "prisma/migrations/20261124120000_advertiser_profiles/migration.sql",
    "prisma/migrations/20261124150000_neighborhood_coordinates/migration.sql",
    "prisma/migrations/20261124160000_weekly_summary/migration.sql",
    "prisma/migrations/20261124170000_price_drop_notice/migration.sql",
    "prisma/migrations/20261126220000_novidades_email/migration.sql",
    "prisma/migrations/20261127120000_security_audit/migration.sql",
    "prisma/migrations/20261127150000_flood_level/migration.sql",
    "prisma/migrations/20261127180000_property_costs/migration.sql",
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
// Testes de comportamento antes do build: se uma regra deixou de valer, o deploy para aqui.
run("vitest", ["run"]);
run("next", ["build"]);
