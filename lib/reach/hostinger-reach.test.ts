import { afterEach, describe, expect, it, vi } from "vitest";
import { contactPayload, findContactUuid, subscribeToReach, unsubscribeFromReach } from "./hostinger-reach";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("contato enviado ao Hostinger Reach", () => {
  it("separa nome e sobrenome e guarda o e-mail em minúsculas", () => {
    expect(contactPayload(" Maria@Exemplo.com ", "Maria da Silva Souza", "perfil")).toEqual({
      email: "maria@exemplo.com",
      name: "Maria",
      surname: "da Silva Souza",
      note: "Cadastro no site (perfil)",
    });
  });

  it("manda só o e-mail quando o visitante não informou nome", () => {
    expect(contactPayload("joao@exemplo.com", null, "rodape")).toEqual({
      email: "joao@exemplo.com",
      note: "Newsletter do rodapé do site",
    });
  });

  it("a observação cabe no limite de 75 caracteres do Reach", () => {
    expect(contactPayload("a@b.com", null, "perfil").note.length).toBeLessThanOrEqual(75);
    expect(contactPayload("a@b.com", null, "rodape").note.length).toBeLessThanOrEqual(75);
  });
});

describe("descadastro no Hostinger Reach", () => {
  it("não confunde o contato com outro e-mail parecido que a busca devolveu", () => {
    const contacts = [
      { uuid: "outro", email: "ana.maria@exemplo.com" },
      { uuid: "certo", email: "Ana@Exemplo.com" },
    ];
    expect(findContactUuid(contacts, "ana@exemplo.com")).toBe("certo");
    expect(findContactUuid(contacts, "maria@exemplo.com")).toBeNull();
  });

  it("marca como descadastrado o contato encontrado", async () => {
    vi.stubEnv("HOSTINGER_API_TOKEN", "token-teste");
    vi.stubEnv("HOSTINGER_REACH_PROFILE_UUID", "perfil-teste");
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ data: [{ uuid: "c1", email: "ana@exemplo.com" }], meta: { total: 1 } }))
      .mockResolvedValueOnce(jsonResponse({ message: "ok" }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(unsubscribeFromReach("ana@exemplo.com")).resolves.toBe(true);
    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toBe("https://developers.hostinger.com/api/reach/v1/profiles/perfil-teste/contacts/c1");
    expect(init).toMatchObject({ method: "PATCH", body: JSON.stringify({ subscription_status: "unsubscribed" }) });
  });
});

describe("integração desligada ou fora do ar", () => {
  it("sem token configurado, não chama a Hostinger", async () => {
    vi.stubEnv("HOSTINGER_API_TOKEN", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(subscribeToReach({ email: "a@b.com", source: "rodape" })).resolves.toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("um erro da Hostinger não quebra a ação do usuário", async () => {
    vi.stubEnv("HOSTINGER_API_TOKEN", "token-teste");
    vi.stubEnv("HOSTINGER_REACH_PROFILE_UUID", "perfil-teste");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ message: "Unauthenticated" }, 401)));
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(subscribeToReach({ email: "a@b.com", source: "perfil" })).resolves.toBe(false);
  });
});
