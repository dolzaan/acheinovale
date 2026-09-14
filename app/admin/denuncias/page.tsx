import Link from "next/link";
import { Header } from "@/components/header";
import { MobileNav } from "@/components/mobile-nav";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { ShieldIcon } from "@/components/icons";
import { requireAdmin } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db";
import { freighterUrl } from "@/lib/listings/urls";
import { reviewReport } from "./actions";

type Props = { searchParams: Promise<{ concluido?: string; erro?: string }> };

export default async function ReportsPage({ searchParams }: Props) {
  await requireAdmin("/admin/denuncias");
  const query = await searchParams;
  const reports = await prisma.report.findMany({
    where: { status: "OPEN", freighterProfileId: { not: null } },
    include: { reporter: { select: { name: true, email: true } }, freighterProfile: { include: { city: true } } },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  return <><Header/><main className="account-page admin-page"><div className="container admin-shell">
    <Link className="back-link" href="/admin/anuncios">← Voltar para moderação</Link>
    <div className="account-heading admin-heading"><span className="section-kicker">Segurança</span><div className="admin-heading__title"><ShieldIcon size={28}/><h1>Denúncias abertas</h1></div><p>Revise relatos enviados pelos usuários sobre perfis de freteiros.</p></div>
    {query.concluido ? <p className="admin-alert admin-alert--success">Denúncia revisada.</p> : null}
    {query.erro ? <p className="admin-alert admin-alert--error">Não foi possível concluir a ação.</p> : null}
    {!reports.length ? <div className="empty-state"><strong>Nenhuma denúncia aberta.</strong><p>A fila está em dia.</p></div> : <div className="moderation-list">{reports.map(report => report.freighterProfile ? <article className="moderation-card" key={report.id}><div className="moderation-card__icon moderation-card__icon--freighter"><ShieldIcon size={26}/></div><div className="moderation-card__body"><div className="moderation-card__top"><div><span className="status-pill status-pill--pending">Denúncia</span><small>{report.reason}</small></div><time>{report.createdAt.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}</time></div><h2>{report.freighterProfile.displayName}</h2><p className="moderation-card__description">{report.details || "Nenhum detalhe adicional."}</p><dl className="moderation-meta"><div><dt>Cidade</dt><dd>{report.freighterProfile.city.name}</dd></div><div><dt>Denunciante</dt><dd>{report.reporter.name || report.reporter.email}</dd></div></dl><div className="moderation-card__footer"><Link className="button button--secondary" href={freighterUrl(report.freighterProfile)} target="_blank">Abrir perfil</Link><div className="moderation-actions"><form action={reviewReport}><input type="hidden" name="id" value={report.id}/><input type="hidden" name="intent" value="resolve"/><PendingSubmitButton className="moderation-button moderation-button--approve" pendingText="Salvando...">Marcar como resolvida</PendingSubmitButton></form><form action={reviewReport}><input type="hidden" name="id" value={report.id}/><input type="hidden" name="intent" value="dismiss"/><PendingSubmitButton className="moderation-button" pendingText="Salvando...">Descartar</PendingSubmitButton></form></div></div></div></article> : null)}</div>}
  </div></main><MobileNav/></>;
}
