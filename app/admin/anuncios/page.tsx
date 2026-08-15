import Link from "next/link";
import type { ContentStatus } from "@prisma/client";
import { Header } from "@/components/header";
import { MobileNav } from "@/components/mobile-nav";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { BuildingIcon, ShieldIcon, TruckIcon } from "@/components/icons";
import { requireAdmin } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db";
import { freighterUrl, propertyUrl } from "@/lib/listings/urls";
import { formatBrazilianPhone } from "@/lib/validation/profile";
import { moderateFreighter, moderateProperty } from "./actions";

type Props = {
  searchParams: Promise<{ tipo?: string; status?: string; concluido?: string; erro?: string }>;
};

const statuses: ContentStatus[] = ["PENDING", "ACTIVE", "REJECTED", "PAUSED"];
const statusLabel: Record<ContentStatus, string> = {
  DRAFT: "Rascunho",
  PENDING: "Em análise",
  ACTIVE: "Ativo",
  PAUSED: "Pausado",
  REJECTED: "Rejeitado",
  ARCHIVED: "Arquivado",
};

const propertyTypeLabel = {
  HOUSE: "Casa",
  APARTMENT: "Apartamento",
  STUDIO: "Kitnet / Studio",
  LAND: "Terreno",
  COMMERCIAL_ROOM: "Sala comercial",
  WAREHOUSE: "Galpão",
  OTHER: "Outro",
} as const;

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value / 100);
}

function date(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(value);
}

function moderationHref(tipo: string, status: ContentStatus) {
  return `/admin/anuncios?tipo=${tipo}&status=${status}`;
}

function ActionForms({ id, status, action }: { id: string; status: ContentStatus; action: typeof moderateProperty }) {
  return (
    <div className="moderation-actions">
      {status !== "ACTIVE" ? (
        <form action={action}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="intent" value="approve" />
          <PendingSubmitButton className="moderation-button moderation-button--approve" pendingText="Publicando...">Aprovar e publicar</PendingSubmitButton>
        </form>
      ) : (
        <form action={action}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="intent" value="pause" />
          <input name="note" maxLength={500} aria-label="Motivo da pausa" placeholder="Motivo da pausa (opcional)" />
          <PendingSubmitButton className="moderation-button" pendingText="Pausando...">Pausar</PendingSubmitButton>
        </form>
      )}
      {status !== "REJECTED" && status !== "ACTIVE" ? (
        <form action={action} className="moderation-reject-form">
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="intent" value="reject" />
          <input name="note" minLength={5} maxLength={500} required aria-label="Motivo da reprovação" placeholder="Explique o que precisa ser corrigido" />
          <PendingSubmitButton className="moderation-button moderation-button--reject" pendingText="Reprovando...">Reprovar</PendingSubmitButton>
        </form>
      ) : null}
    </div>
  );
}

export default async function ModerationPage({ searchParams }: Props) {
  await requireAdmin();
  const params = await searchParams;
  const tipo = params.tipo === "freteiros" || params.tipo === "imoveis" ? params.tipo : "todos";
  const status = statuses.includes(params.status as ContentStatus) ? params.status as ContentStatus : "PENDING";

  const [properties, freighters, pendingProperties, pendingFreighters, activeProperties, activeFreighters, rejectedProperties, rejectedFreighters] = await Promise.all([
    prisma.property.findMany({
      where: { status },
      include: { owner: { select: { name: true, email: true, phone: true } }, city: true, neighborhood: true },
      orderBy: { createdAt: "asc" },
      take: 100,
    }),
    prisma.freighterProfile.findMany({
      where: { status },
      include: { user: { select: { name: true, email: true, phone: true } }, city: true, services: true },
      orderBy: { createdAt: "asc" },
      take: 100,
    }),
    prisma.property.count({ where: { status: "PENDING" } }),
    prisma.freighterProfile.count({ where: { status: "PENDING" } }),
    prisma.property.count({ where: { status: "ACTIVE" } }),
    prisma.freighterProfile.count({ where: { status: "ACTIVE" } }),
    prisma.property.count({ where: { status: "REJECTED" } }),
    prisma.freighterProfile.count({ where: { status: "REJECTED" } }),
  ]);

  const visibleProperties = tipo === "freteiros" ? [] : properties;
  const visibleFreighters = tipo === "imoveis" ? [] : freighters;
  const total = visibleProperties.length + visibleFreighters.length;
  const activeTotal = activeProperties + activeFreighters;
  const rejectedTotal = rejectedProperties + rejectedFreighters;
  const successMessages: Record<string, string> = { approve: "Anúncio aprovado e publicado.", reject: "Anúncio reprovado e o motivo foi salvo.", pause: "Anúncio pausado." };

  return (
    <>
      <Header />
      <main className="account-page admin-page">
        <div className="container admin-shell">
          <div className="account-heading admin-heading">
            <span className="section-kicker">Administração</span>
            <div className="admin-heading__title"><ShieldIcon size={28} /><h1>Moderação de anúncios</h1></div>
            <p>Revise imóveis e serviços antes de deixá-los públicos no AcheiNoVale.</p>
          </div>

          {params.concluido && successMessages[params.concluido] ? <p className="admin-alert admin-alert--success">{successMessages[params.concluido]}</p> : null}
          {params.erro ? <p className="admin-alert admin-alert--error">{params.erro === "motivo" ? "Informe um motivo com pelo menos 5 caracteres." : "Não foi possível concluir a ação."}</p> : null}

          <section className="admin-stats" aria-label="Resumo da moderação">
            <div><small>Aguardando análise</small><strong>{pendingProperties + pendingFreighters}</strong><span>{pendingProperties} imóveis · {pendingFreighters} freteiros</span></div>
            <div><small>Publicados</small><strong>{activeTotal}</strong><span>Visíveis para o público</span></div>
            <div><small>Reprovados</small><strong>{rejectedTotal}</strong><span>Com orientação para correção</span></div>
          </section>

          <div className="admin-toolbar">
            <nav className="admin-tabs" aria-label="Tipo de anúncio">
              {[{ value: "todos", label: "Todos" }, { value: "imoveis", label: "Imóveis" }, { value: "freteiros", label: "Freteiros" }].map(item => (
                <Link className={tipo === item.value ? "is-active" : ""} href={moderationHref(item.value, status)} key={item.value}>{item.label}</Link>
              ))}
            </nav>
            <nav className="admin-status-links" aria-label="Filtrar por status">
              {statuses.map(item => <Link className={status === item ? "is-active" : ""} href={moderationHref(tipo, item)} key={item}>{statusLabel[item]}</Link>)}
            </nav>
          </div>

          <div className="admin-results-heading"><strong>{total} {total === 1 ? "resultado" : "resultados"}</strong><span>Mais antigos primeiro</span></div>
          {!total ? <div className="empty-state"><strong>Nenhum anúncio neste filtro.</strong><p>A fila está em dia por aqui.</p></div> : null}

          <div className="moderation-list">
            {visibleProperties.map(property => (
              <article className="moderation-card" key={property.id}>
                <div className="moderation-card__icon moderation-card__icon--property"><BuildingIcon size={27} /></div>
                <div className="moderation-card__body">
                  <div className="moderation-card__top"><div><span className={`status-pill status-pill--${property.status.toLowerCase()}`}>{statusLabel[property.status]}</span><small>Imóvel · {propertyTypeLabel[property.type]} · Código {property.publicCode.toUpperCase()}</small></div><time>{date(property.createdAt)}</time></div>
                  <h2>{property.title}</h2>
                  <p className="moderation-card__description">{property.description}</p>
                  <dl className="moderation-meta"><div><dt>Local</dt><dd>{property.neighborhood.name}, {property.city.name}</dd></div><div><dt>Valor</dt><dd>{money(property.priceCents)}</dd></div><div><dt>Anunciante</dt><dd>{property.owner.name || "Sem nome"} · {property.owner.email}</dd></div><div><dt>WhatsApp</dt><dd>{formatBrazilianPhone(property.whatsapp)}</dd></div></dl>
                  {property.moderationNote ? <p className="moderation-note"><strong>Última observação:</strong> {property.moderationNote}</p> : null}
                  <div className="moderation-card__footer"><Link className="button button--secondary" href={propertyUrl(property)} target="_blank" rel="noreferrer">Abrir prévia</Link><ActionForms id={property.id} status={property.status} action={moderateProperty} /></div>
                </div>
              </article>
            ))}

            {visibleFreighters.map(freighter => (
              <article className="moderation-card" key={freighter.id}>
                <div className="moderation-card__icon moderation-card__icon--freighter"><TruckIcon size={27} /></div>
                <div className="moderation-card__body">
                  <div className="moderation-card__top"><div><span className={`status-pill status-pill--${freighter.status.toLowerCase()}`}>{statusLabel[freighter.status]}</span><small>Freteiro · Código {freighter.publicCode.toUpperCase()}</small></div><time>{date(freighter.createdAt)}</time></div>
                  <h2>{freighter.displayName}</h2>
                  <p className="moderation-card__description">{freighter.description}</p>
                  <dl className="moderation-meta"><div><dt>Cidade</dt><dd>{freighter.city.name}</dd></div><div><dt>Serviços</dt><dd>{freighter.services.map(service => service.name).join(", ")}</dd></div><div><dt>Responsável</dt><dd>{freighter.user.name || "Sem nome"} · {freighter.user.email}</dd></div><div><dt>WhatsApp</dt><dd>{formatBrazilianPhone(freighter.whatsapp)}</dd></div></dl>
                  {freighter.moderationNote ? <p className="moderation-note"><strong>Última observação:</strong> {freighter.moderationNote}</p> : null}
                  <div className="moderation-card__footer"><Link className="button button--secondary" href={freighterUrl(freighter)} target="_blank" rel="noreferrer">Abrir prévia</Link><ActionForms id={freighter.id} status={freighter.status} action={moderateFreighter} /></div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>
      <MobileNav />
    </>
  );
}
