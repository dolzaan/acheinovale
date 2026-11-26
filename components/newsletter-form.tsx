"use client";

import Link from "next/link";
import { useActionState } from "react";
import { subscribeNewsletter, type NewsletterState } from "@/app/newsletter/actions";

const INITIAL: NewsletterState = { status: "idle" };

export function NewsletterForm() {
  const [state, action, pending] = useActionState(subscribeNewsletter, INITIAL);

  if (state.status === "ok") {
    return <p className="newsletter-form__feedback" role="status">{state.message ?? "Pronto! Você vai receber nossas novidades."}</p>;
  }

  return (
    <form className="newsletter-form" action={action}>
      <label htmlFor="newsletter-email"><strong>Receba novidades do Vale</strong></label>
      <div className="newsletter-form__row">
        <input id="newsletter-email" type="email" name="email" placeholder="seu@email.com" autoComplete="email" maxLength={254} required defaultValue={state.email} key={state.email ?? ""} />
        <button className="button newsletter-form__button" type="submit" disabled={pending}>{pending ? "Enviando…" : "Quero receber"}</button>
      </div>
      <input className="newsletter-form__trap" type="text" name="site" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      {state.message && <p className="newsletter-form__feedback newsletter-form__feedback--error" role="alert">{state.message}</p>}
      <small>Imóveis, fretes e dicas da região. Cancele quando quiser. Veja a <Link href="/privacidade">Política de Privacidade</Link>.</small>
    </form>
  );
}
