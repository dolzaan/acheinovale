import Link from "next/link";
import { Header } from "@/components/header";
import { MobileNav } from "@/components/mobile-nav";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { BuildingIcon, ShieldIcon, TruckIcon } from "@/components/icons";
import { requireAdmin } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db";
import { freighterUrl, propertyUrl } from "@/lib/listings/urls";
import { reviewReport } from "./actions";

type Props = { searchParams: Promise<{ concluido?: string; erro?: string }> };

export default async function ReportsPage({ searchParams }: Props) {
  await requireAdmin("/admin/denuncias");
  const query = await searchParams;
  const reports = await prisma.report.findMany({
    where: { status: "OPEN", OR: [{ freighterProfileId: { not: null } }, { propertyId: { not: null } }] },
    include: {
      reporter: { select: { name: true, email: true } },
      freighterProfile: { include: { city: true } },
      property: { include: { city: true, neighborhood: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  return <><Header/><main className="account-page admin-page"><div className="container admin-shell">
    <Link className="back-link" href="/admin/anuncios">← Voltar para moderação</Link>
    <div className="account-heading admin-heading"><span className="section-kicker">Segurança</span><div className="admin-heading__title"><ShieldIcon size={28}/><h1>Denúncias abertas</h1></div><p>Revise relatos enviados pelos usuários sobre imóveis e perfis de freteiros.</p><div className="admin-heading__links"><Link className="button button--secondary" href="/admin/avaliacoes">Moderar avaliações</Link></div></div>
    {query.concluido ? <p className="admin-alert admin-alert--success">Denúncia revisada.</p> : null}
    {query.erro ? <p className="admin-alert admin-alert--error">Não foi possível concluir a ação.</p> : null}
    {!reports.length ? <div className="empty-state"><strong>Nenhuma denúncia aberta.</strong><p>A fila está em dia.</p></div> : <div className="moderation-list">{reports.map(report => {
      const target = report.property
        ? { kind: "Imóvel", icon: <BuildingIcon size={26}/>, iconClass: "moderation-card__icon--property", title: report.property.title, place: `${report.property.neighborhood.name}, ${report.property.city.name}`, href: propertyUrl(report.property), code: report.property.publicCode }
        : report.freighterProfile
          ? { kind: "Freteiro", icon: <TruckIcon size={26}/>, iconClass: "moderation-card__icon--freighter", title: report.freighterProfile.displayName, place: report.freighterProfile.city.name, href: freighterUrl(report.freighterProfile), code: report.freighterProfile.publicCode }
          : null;
      if (!target) return null;
      return <article className="moderation-card" key={report.id}><div className={`moderation-card__icon ${target.iconClass}`}>{target.icon}</div><div className="moderation-card__body"><div className="moderation-card__top"><div><span className="status-pill status-pill--pending">Denúncia</span><small>{target.kind} · {report.reason} · Código {target.code.toUpperCase()}</small></div><time>{report.createdAt.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}</time></div><h2>{target.title}</h2><p className="moderation-card__description">{report.details || "Nenhum detalhe adicional."}</p><dl className="moderation-meta"><div><dt>Local</dt><dd>{target.place}</dd></div><div><dt>Denunciante</dt><dd>{report.reporter.name || report.reporter.email}</dd></div></dl><div className="moderation-card__footer"><Link className="button button--secondary" href={target.href} target="_blank">Abrir anúncio</Link><div className="moderation-actions"><form action={reviewReport}><input type="hidden" name="id" value={report.id}/><input type="hidden" name="intent" value="resolve"/><PendingSubmitButton className="moderation-button moderation-button--approve" pendingText="Salvando...">Marcar como resolvida</PendingSubmitButton></form><form action={reviewReport}><input type="hidden" name="id" value={report.id}/><input type="hidden" name="intent" value="dismiss"/><PendingSubmitButton className="moderation-button" pendingText="Salvando...">Descartar</PendingSubmitButton></form></div></div></div></article>;
    })}</div>}
  </div></main><MobileNav/></>;
}
