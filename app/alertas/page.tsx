import Link from "next/link";
import { Header } from "@/components/header";
import { MobileNav } from "@/components/mobile-nav";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { describeAlert } from "@/lib/alerts/saved-search";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db";
import { deleteSavedSearch } from "./actions";

type Props = { searchParams: Promise<{ removido?: string }> };

export default async function AlertsPage({ searchParams }: Props) {
  const [user, query] = await Promise.all([requireCurrentUser("/alertas"), searchParams]);
  const alerts = await prisma.savedSearch.findMany({
    where: { userId: user.id, isActive: true },
    include: { city: { select: { name: true } }, neighborhood: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <Header />
      <main className="account-page">
        <div className="container listings-page">
          <div className="account-heading">
            <span className="section-kicker">Sua área</span>
            <h1>Alertas de imóveis</h1>
            <p>Receba no máximo um e-mail por dia em {user.email} com os imóveis novos que combinam com suas buscas.</p>
          </div>
          {query.removido ? <p className="form-success" role="status">Alerta removido.</p> : null}
          {!alerts.length ? (
            <div className="empty-state">
              <strong>Nenhum alerta ativo</strong>
              <p>Faça uma busca no catálogo e use “Criar alerta para esta busca”.</p>
              <Link prefetch={false} className="button button--primary" href="/imoveis">Buscar imóveis</Link>
            </div>
          ) : (
            <div className="listing-manager">
              {alerts.map(alert => (
                <article className="manager-card" key={alert.id}>
                  <div className="manager-card__content">
                    <h2>{describeAlert(alert)}</h2>
                    <p>Criado em {alert.createdAt.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}{alert.lastNotifiedAt ? ` · último envio em ${alert.lastNotifiedAt.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}` : ""}</p>
                  </div>
                  <div className="manager-card__actions">
                    <form action={deleteSavedSearch}><input type="hidden" name="id" value={alert.id} /><PendingSubmitButton pendingText="Removendo...">Remover alerta</PendingSubmitButton></form>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
      <MobileNav />
    </>
  );
}
