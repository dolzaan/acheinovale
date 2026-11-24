import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { prisma } from "@/lib/db";
import { unsubscribeWeeklySummary } from "../actions";

export const metadata: Metadata = { title: "Cancelar resumo semanal | AcheiNoVale", robots: { index: false, follow: false } };

type Props = { searchParams: Promise<{ token?: string; concluido?: string }> };

// Exige um clique de confirmação: leitores de e-mail que abrem links sozinhos não cancelam o resumo.
export default async function WeeklySummaryUnsubscribePage({ searchParams }: Props) {
  const { token, concluido } = await searchParams;
  const user = token
    ? await prisma.user.findUnique({ where: { summaryUnsubscribeToken: token }, select: { weeklySummaryOptOut: true } })
    : null;

  return (
    <>
      <Header />
      <main id="conteudo" className="auth-page">
        <section className="auth-card">
          {concluido ? (
            <><h1>Resumo cancelado</h1><p>Você não vai mais receber o resumo semanal dos seus anúncios. Dá para ativar de novo em Meu perfil.</p><Link href="/meus-anuncios">Abrir Meus anúncios</Link></>
          ) : !user ? (
            <><h1>Link inválido</h1><p>Não encontramos este link. Você pode desativar o resumo em Meu perfil.</p><Link href="/perfil">Abrir Meu perfil</Link></>
          ) : user.weeklySummaryOptOut ? (
            <><h1>Resumo já cancelado</h1><p>Você já não recebe o resumo semanal.</p><Link href="/meus-anuncios">Abrir Meus anúncios</Link></>
          ) : (
            <>
              <h1>Parar de receber o resumo semanal?</h1>
              <p>Toda segunda-feira enviamos as visualizações e os contatos dos seus anúncios na semana.</p>
              <form action={unsubscribeWeeklySummary}>
                <input type="hidden" name="token" value={token} />
                <PendingSubmitButton className="button button--primary" pendingText="Cancelando…">Parar de receber</PendingSubmitButton>
              </form>
            </>
          )}
        </section>
      </main>
    </>
  );
}
