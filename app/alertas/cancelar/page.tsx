import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { describeAlert } from "@/lib/alerts/saved-search";
import { prisma } from "@/lib/db";
import { unsubscribeSavedSearch } from "../actions";

export const metadata: Metadata = { title: "Cancelar alerta | AcheiNoVale", robots: { index: false, follow: false } };

type Props = { searchParams: Promise<{ token?: string; concluido?: string }> };

// O cancelamento exige um clique de confirmação: leitores de e-mail que abrem
// links automaticamente não devem desativar o alerta sozinhos.
export default async function UnsubscribePage({ searchParams }: Props) {
  const { token, concluido } = await searchParams;
  const alert = token
    ? await prisma.savedSearch.findUnique({ where: { unsubscribeToken: token }, include: { city: { select: { name: true } }, neighborhood: { select: { name: true } } } })
    : null;

  return (
    <>
      <Header />
      <main className="auth-page">
        <section className="auth-card">
          {concluido ? (
            <><h1>Alerta cancelado</h1><p>Você não vai mais receber e-mails desse alerta.</p><Link href="/imoveis">Voltar aos imóveis</Link></>
          ) : !alert ? (
            <><h1>Link inválido</h1><p>Este alerta não foi encontrado. Ele pode já ter sido removido.</p><Link href="/alertas">Ver meus alertas</Link></>
          ) : !alert.isActive ? (
            <><h1>Alerta já cancelado</h1><p>{describeAlert(alert)}</p><Link href="/imoveis">Voltar aos imóveis</Link></>
          ) : (
            <>
              <h1>Cancelar alerta?</h1>
              <p>{describeAlert(alert)}</p>
              <form action={unsubscribeSavedSearch}>
                <input type="hidden" name="token" value={alert.unsubscribeToken} />
                <PendingSubmitButton className="button button--primary" pendingText="Cancelando...">Cancelar este alerta</PendingSubmitButton>
              </form>
            </>
          )}
        </section>
      </main>
    </>
  );
}
