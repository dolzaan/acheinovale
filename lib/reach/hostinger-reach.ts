import "server-only";

// Lista de e-mails de novidades no Hostinger Reach.
// Sem HOSTINGER_API_TOKEN e HOSTINGER_REACH_PROFILE_UUID, nada é enviado e o site segue funcionando.
// Falhas só vão para o log: assinar ou cancelar novidades nunca quebra a ação do usuário.

const API_BASE = "https://developers.hostinger.com/api/reach/v1";

type ReachConfig = { token: string; profileUuid: string };

type ReachContact = { uuid?: unknown; email?: unknown };

export type ReachSource = "perfil" | "rodape";

const SOURCE_NOTES: Record<ReachSource, string> = {
  perfil: "Cadastro no site (perfil)",
  rodape: "Newsletter do rodapé do site",
};

function reachConfig(): ReachConfig | null {
  const token = process.env.HOSTINGER_API_TOKEN?.trim();
  const profileUuid = process.env.HOSTINGER_REACH_PROFILE_UUID?.trim();
  return token && profileUuid ? { token, profileUuid } : null;
}

export function contactPayload(email: string, fullName: string | null | undefined, source: ReachSource) {
  const [name, ...rest] = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
  return {
    email: email.trim().toLowerCase(),
    ...(name ? { name } : {}),
    ...(rest.length ? { surname: rest.join(" ") } : {}),
    note: SOURCE_NOTES[source],
  };
}

/** A busca do Reach pode trazer e-mails parecidos; só vale o que for exatamente igual. */
export function findContactUuid(contacts: unknown, email: string): string | null {
  if (!Array.isArray(contacts)) return null;
  const wanted = email.trim().toLowerCase();
  const match = (contacts as ReachContact[]).find(
    contact => typeof contact?.email === "string" && contact.email.trim().toLowerCase() === wanted,
  );
  return typeof match?.uuid === "string" ? match.uuid : null;
}

async function reachRequest(config: ReachConfig, path: string, init: { method: string; body?: unknown }) {
  const response = await fetch(`${API_BASE}/profiles/${encodeURIComponent(config.profileUuid)}${path}`, {
    method: init.method,
    headers: {
      Authorization: `Bearer ${config.token}`,
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
    signal: AbortSignal.timeout(10_000),
    cache: "no-store",
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Hostinger Reach respondeu ${response.status}: ${detail.slice(0, 300)}`);
  }
  return response.status === 204 ? null : response.json().catch(() => null);
}

function logFailure(action: string, error: unknown) {
  console.error(JSON.stringify({
    level: "error",
    message: "hostinger_reach_failed",
    action,
    error: error instanceof Error ? error.message : String(error),
  }));
}

/** Coloca o e-mail na lista. Se o contato já existe, o Reach mantém o que já tinha. */
export async function subscribeToReach(params: { email: string; name?: string | null; source: ReachSource }) {
  const config = reachConfig();
  if (!config) return false;
  try {
    await reachRequest(config, "/contacts", { method: "POST", body: contactPayload(params.email, params.name, params.source) });
    return true;
  } catch (error) {
    logFailure("subscribe", error);
    return false;
  }
}

/** Marca o contato como descadastrado, mantendo o histórico no Reach. */
export async function unsubscribeFromReach(email: string) {
  const config = reachConfig();
  if (!config) return false;
  try {
    const list = await reachRequest(config, `/contacts?search=${encodeURIComponent(email.trim().toLowerCase())}&per_page=50`, { method: "GET" });
    const uuid = findContactUuid((list as { data?: unknown } | null)?.data, email);
    if (!uuid) return false;
    await reachRequest(config, `/contacts/${encodeURIComponent(uuid)}`, { method: "PATCH", body: { subscription_status: "unsubscribed" } });
    return true;
  } catch (error) {
    logFailure("unsubscribe", error);
    return false;
  }
}
