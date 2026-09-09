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
  console.log("[build] Aplicando migrações pendentes no banco de produção...");
  run("prisma", ["migrate", "deploy"]);
}

run("prisma", ["generate"]);
run("next", ["build"]);
