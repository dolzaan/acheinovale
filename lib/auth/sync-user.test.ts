import { describe, expect, it } from "vitest";
import { canLinkExistingAccountByEmail } from "./sync-user";

const googleIdentity = (email: string) => ({ provider: "google", identity_data: { email } }) as never;

describe("assumir conta existente pelo e-mail", () => {
  it("permite quando o login é do Google com o mesmo e-mail confirmado", () => {
    expect(canLinkExistingAccountByEmail({
      email: "Admin@Exemplo.com",
      email_confirmed_at: "2026-11-27T10:00:00Z",
      identities: [googleIdentity("admin@exemplo.com")],
    })).toBe(true);
  });

  it("recusa sessão por e-mail e senha, mesmo com o e-mail da vítima", () => {
    expect(canLinkExistingAccountByEmail({
      email: "admin@exemplo.com",
      email_confirmed_at: "2026-11-27T10:00:00Z",
      identities: [{ provider: "email", identity_data: { email: "admin@exemplo.com" } } as never],
    })).toBe(false);
  });

  it("recusa e-mail não confirmado", () => {
    expect(canLinkExistingAccountByEmail({
      email: "admin@exemplo.com",
      email_confirmed_at: undefined,
      identities: [googleIdentity("admin@exemplo.com")],
    })).toBe(false);
  });

  it("recusa quando o Google confirmou outro e-mail", () => {
    expect(canLinkExistingAccountByEmail({
      email: "admin@exemplo.com",
      email_confirmed_at: "2026-11-27T10:00:00Z",
      identities: [googleIdentity("atacante@exemplo.com")],
    })).toBe(false);
  });
});
