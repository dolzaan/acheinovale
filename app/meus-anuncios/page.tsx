import Link from "next/link";
import { Header } from "@/components/header";
import { MobileNav } from "@/components/mobile-nav";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { ClearPropertyDraft } from "@/components/clear-property-draft";
import { PublishConversionEvent } from "@/components/publish-conversion-event";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db";
import { freighterUrl, propertyUrl } from "@/lib/listings/urls";
import { availabilityDeadline, needsAvailabilityConfirmation } from "@/lib/listings/availability";
import { archiveProperty, confirmPropertyAvailability, pauseFreighter, pauseProperty } from "./actions";

const statusLabel = { DRAFT: "Rascunho", PENDING: "Em análise", ACTIVE: "Ativo", PAUSED: "Pausado", REJECTED: "Rejeitado", ARCHIVED: "Arquivado" } as const;

const METRICS_DAYS = 30;

function metricsSinceDate() {
  return new Date(Date.now() - METRICS_DAYS * 24 * 60 * 60 * 1000);
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "America/Sao_Paulo" }).format(value);
}

function ModerationFeedback({ note }: { note: string | null }) {
  if (!note) return null;
  return <p className="manager-card__feedback"><strong>Orientação da moderação:</strong> {note}</p>;
}

type Props = { searchParams: Promise<{ criado?: string }> };

export default async function MyListingsPage({ searchParams }: Props) {
  const [user, params] = await Promise.all([requireCurrentUser("/meus-anuncios"), searchParams]);
  const [properties, freighter] = await Promise.all([
    prisma.property.findMany({ where: { ownerId: user.id, status: { not: "ARCHIVED" } }, orderBy: { createdAt: "desc" }, include: { city: true } }),
    prisma.freighterProfile.findUnique({ where: { userId: user.id }, include: { city: true, images: { select: { id: true } }, services: { select: { name: true } } } }),
  ]);
  const freighterMetrics = freighter ? await prisma.freighterMetricDaily.findMany({
    where: { profileId: freighter.id },
    orderBy: { date: "desc" },
    take: 30,
    select: { views: true, whatsappClicks: true },
  }).catch(() => []) : [];
  const propertyMetrics = properties.length ? await prisma.propertyMetricDaily.groupBy({
    by: ["propertyId"],
    where: { propertyId: { in: properties.map(property => property.id) }, date: { gte: metricsSinceDate() } },
    _sum: { views: true, whatsappClicks: true },
  }).catch(() => []) : [];
  const metricsByProperty = new Map(propertyMetrics.map(metric => [metric.propertyId, metric._sum]));
  const metricTotals = freighterMetrics.reduce((totals, metric) => ({
    views: totals.views + metric.views,
    whatsappClicks: totals.whatsappClicks + metric.whatsappClicks,
  }), { views: 0, whatsappClicks: 0 });

  return (
    <>
      {params.criado === "imovel" ? <PublishConversionEvent name="publish_property_submitted" /> : null}
      <Header />
      <main className="account-page">
        <div className="container listings-page">
          {params.criado === "imovel" ? <ClearPropertyDraft ownerKey={user.authUserId || user.id} /> : null}
          <div className="account-heading account-heading--row">
            <div><span className="section-kicker">Sua área</span><h1>Meus anúncios</h1><p>Gerencie imóveis e serviços publicados com a sua conta.</p></div>
            <Link className="button button--primary" href="/publicar">Novo anúncio</Link>
          </div>

          {!properties.length && !freighter ? (
            <div className="empty-state"><strong>Você ainda não publicou nada.</strong><p>Seu primeiro anúncio leva poucos minutos.</p><Link className="button button--primary" href="/publicar">Publicar grátis</Link></div>
          ) : (
            <div className="listing-manager">
              {properties.map(property => (
                <article className="manager-card" key={property.id}>
                  <div className="manager-card__content">
                    <span className={`status-pill status-pill--${property.status.toLowerCase()}`}>{statusLabel[property.status]}</span>
                    <h2>{property.title}</h2>
                    <p>{property.city.name} · {property.purpose === "RENT" ? "Aluguel" : "Venda"} · Código {property.publicCode.toUpperCase()}</p>
                    {property.status === "ACTIVE" || property.status === "PAUSED" ? <div className="manager-metrics"><span><strong>{metricsByProperty.get(property.id)?.views ?? 0}</strong> visualizações</span><span><strong>{metricsByProperty.get(property.id)?.whatsappClicks ?? 0}</strong> contatos no WhatsApp</span><small>Últimos {METRICS_DAYS} dias</small></div> : null}
                    {property.status === "ACTIVE" && needsAvailabilityConfirmation(property) ? (
                      <form className="manager-card__availability" action={confirmPropertyAvailability}>
                        <input type="hidden" name="id" value={property.id} />
                        <p><strong>Este imóvel ainda está disponível?</strong> Confirme até {formatDate(availabilityDeadline(property).pauseAt)} para manter o anúncio no ar. Se já foi alugado ou vendido, arquive o anúncio.</p>
                        <PendingSubmitButton pendingText="Confirmando...">Sim, continua disponível</PendingSubmitButton>
                      </form>
                    ) : null}
                    <ModerationFeedback note={property.moderationNote} />
                  </div>
                  <div className="manager-card__actions">
                    <Link href={propertyUrl(property)}>Visualizar</Link>
                    <Link href={`/meus-anuncios/${property.id}/editar`}>Editar dados</Link>
                    <Link href={`/meus-anuncios/${property.id}/midias`}>Editar mídias</Link>
                    {property.status === "ACTIVE" || property.status === "PAUSED" ? <form action={pauseProperty}><input type="hidden" name="id" value={property.id} /><PendingSubmitButton pendingText={property.status === "PAUSED" ? "Reativando..." : "Pausando..."}>{property.status === "PAUSED" ? "Reativar" : "Pausar"}</PendingSubmitButton></form> : null}
                    <form action={archiveProperty}><input type="hidden" name="id" value={property.id} /><PendingSubmitButton pendingText="Arquivando...">Arquivar</PendingSubmitButton></form>
                  </div>
                </article>
              ))}

              {freighter ? (
                <article className="manager-card">
                  <div className="manager-card__content">
                    <span className={`status-pill status-pill--${freighter.status.toLowerCase()}`}>{statusLabel[freighter.status]}</span>
                    <h2>{freighter.displayName}</h2>
                    <p>Freteiro · {freighter.city.name} · Código {freighter.publicCode.toUpperCase()}</p>
                    <div className="manager-metrics"><span><strong>{metricTotals.views}</strong> visualizações</span><span><strong>{metricTotals.whatsappClicks}</strong> contatos no WhatsApp</span><small>Últimos {METRICS_DAYS} dias</small></div>
                    <ModerationFeedback note={freighter.moderationNote} />
                  </div>
                  <div className="manager-card__actions">
                    <Link href={freighterUrl(freighter)}>Visualizar</Link>
                    <Link href="/publicar/frete">Editar cadastro</Link>
                    <Link href={`/meus-anuncios/${freighter.id}/freteiro-midias`}>Editar fotos</Link>
                    {freighter.status === "ACTIVE" || freighter.status === "PAUSED" ? <form action={pauseFreighter}><input type="hidden" name="id" value={freighter.id} /><PendingSubmitButton pendingText={freighter.status === "PAUSED" ? "Reativando..." : "Pausando..."}>{freighter.status === "PAUSED" ? "Reativar" : "Pausar"}</PendingSubmitButton></form> : null}
                  </div>
                </article>
              ) : null}
            </div>
          )}
        </div>
      </main>
      <MobileNav />
    </>
  );
}
