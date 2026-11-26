import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// O build de produção só aplica as migrações listadas em scripts/build.mjs.
// Uma migração fora da lista não chega ao banco e o site quebra ao ler a coluna nova.
const root = join(__dirname, "..");
const buildScript = readFileSync(join(root, "scripts/build.mjs"), "utf8");
const migrationsDir = join(root, "prisma/migrations");
const migrations = readdirSync(migrationsDir, { withFileTypes: true })
  .filter(entry => entry.isDirectory() && existsSync(join(migrationsDir, entry.name, "migration.sql")))
  .map(entry => entry.name);

describe("migrações de produção", () => {
  it.each(migrations.filter(name => name >= "20261124120000"))("%s é aplicada no build de produção", name => {
    expect(buildScript).toContain(`prisma/migrations/${name}/migration.sql`);
  });
});
