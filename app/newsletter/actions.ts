"use server";

import { headers } from "next/headers";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { subscribeToReach } from "@/lib/reach/hostinger-reach";

export type NewsletterState = { status: "idle" | "ok" | "erro" | "limite"; message?: string; email?: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function subscribeNewsletter(_previous: NewsletterState, formData: FormData): Promise<NewsletterState> {
  // Campo escondido: só robôs preenchem. Finge que deu certo para não ensinar o robô.
  if (String(formData.get("site") ?? "").trim()) return { status: "ok" };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return { status: "erro", message: "Confira o e-mail e tente de novo.", email };
  }

  const requestHeaders = await headers();
  const ip = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || "desconhecido";
  const rateLimit = await checkRateLimit({ scope: "newsletter", identifier: ip, limit: 5, windowSeconds: 60 * 60 });
  if (!rateLimit.allowed) {
    return { status: "limite", message: "Muitas tentativas. Tente de novo mais tarde.", email };
  }

  const subscribed = await subscribeToReach({ email, source: "rodape" });
  return subscribed
    ? { status: "ok", message: "Pronto! Se chegar um e-mail de confirmação, é só clicar no link." }
    : { status: "erro", message: "Não foi possível cadastrar agora. Tente de novo mais tarde.", email };
}
