import Link from "next/link";
import { Header } from "@/components/header";
import { MobileNav } from "@/components/mobile-nav";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { StarIcon } from "@/components/icons";
import { requireAdmin } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db";
import { freighterUrl } from "@/lib/listings/urls";
import { setReviewVisibility } from "./actions";

type Props = { searchParams: Promise<{ concluido?: string; erro?: string; ocultas?: string }> };

export default async function ReviewsModerationPage({ searchParams }: Props) {
  await requireAdmin("/admin/avaliacoes");
  const query = await searchParams;
  const showHidden = query.ocultas === "1";
  const reviews = await prisma.review.findMany({
    where: { isVisible: !showHidden },
    include: {
      author: { select: { name: true, email: true } },
      profile: { select: { displayName: true, publicCode: true, slug: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  return <><Header/><main className="account-page admin-page"><div className="container admin-shell">
    <Link className="back-link" href="/admin/denuncias">← Voltar para denúncias</Link>
    <div className="account-heading admin-heading"><span className="section-kicker">Segurança</span><div className="admin-heading__title"><StarIcon size={26}/><h1>Avaliações de freteiros</h1></div><p>As avaliações são publicadas na hora. Oculte as que forem ofensivas, falsas ou fora do assunto.</p></div>
    {query.concluido ? <p className="admin-alert admin-alert--success">Avaliação atualizada.</p> : null}
    {query.erro ? <p className="admin-alert admin-alert--error">Não foi possível concluir a ação.</p> : null}
    <nav className="admin-status-links" aria-label="Filtrar avaliações"><Link className={!showHidden ? "is-active" : ""} href="/admin/avaliacoes">Publicadas</Link><Link className={showHidden ? "is-active" : ""} href="/admin/avaliacoes?ocultas=1">Ocultas</Link></nav>
    {!reviews.length ? <div className="empty-state"><strong>Nenhuma avaliação neste filtro.</strong></div> : <div className="moderation-list">{reviews.map(review => (
      <article className="moderation-card" key={review.id}><div className="moderation-card__body">
        <div className="moderation-card__top"><div><span className={`status-pill status-pill--${review.isVisible ? "active" : "paused"}`}>{review.rating} de 5</span><small>{review.author.name || review.author.email}</small></div><time>{review.updatedAt.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}</time></div>
        <h2>{review.profile.displayName}</h2>
        <p className="moderation-card__description">{review.comment || "Sem comentário."}</p>
        <div className="moderation-card__footer"><Link className="button button--secondary" href={`${freighterUrl(review.profile)}#avaliacoes`} target="_blank">Abrir perfil</Link><div className="moderation-actions"><form action={setReviewVisibility}><input type="hidden" name="id" value={review.id}/><input type="hidden" name="visible" value={review.isVisible ? "0" : "1"}/><PendingSubmitButton className={`moderation-button${review.isVisible ? " moderation-button--reject" : " moderation-button--approve"}`} pendingText="Salvando...">{review.isVisible ? "Ocultar" : "Publicar novamente"}</PendingSubmitButton></form></div></div>
      </div></article>
    ))}</div>}
  </div></main><MobileNav/></>;
}
