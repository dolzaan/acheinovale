import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getPublicSupabaseConfig } from "./config";

// Fica aqui, e não em config.ts, porque config.ts também é importado pelo navegador.
// O "server-only" acima faz o build falhar se este arquivo chegar ao cliente.
function getSupabaseServiceRoleKey() {
  const serviceRoleKey =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error("Defina SUPABASE_SECRET_KEY somente no ambiente do servidor.");
  }

  return serviceRoleKey;
}

export function createAdminClient() {
  const { url } = getPublicSupabaseConfig();

  return createClient(url, getSupabaseServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
