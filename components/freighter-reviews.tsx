import Link from "next/link";
import { submitReview } from "@/app/freteiro/actions";
import { StarIcon } from "@/components/icons";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { UserAvatar } from "@/components/user-avatar";

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  authorId: string;
  author: { name: string | null; image: string | null };
};

type Props = {
  profileId: string;
  ownerId: string;
  reviews: Review[];
  viewerId: string | null;
  loginHref: string;
  status?: string;
};

const VISIBLE_REVIEWS = 10;

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "America/Sao_Paulo" }).format(value);
}

export function FreighterReviews({ profileId, ownerId, reviews, viewerId, loginHref, status }: Props) {
  const ownReview = viewerId ? reviews.find(review => review.authorId === viewerId) : undefined;
  const canReview = viewerId !== ownerId;

  return (
    <section className="listing-description freighter-reviews" id="avaliacoes" aria-labelledby="freighter-reviews-title">
      <h2 id="freighter-reviews-title">Avaliações</h2>
      {status === "enviada" ? <p className="listing-report-success" role="status">Obrigado! Sua avaliação foi publicada.</p> : null}
      {status === "limite" ? <p className="listing-report-error" role="alert">Limite diário de avaliações atingido.</p> : null}
      {status === "erro" ? <p className="listing-report-error" role="alert">Não foi possível salvar a avaliação.</p> : null}

      {reviews.length ? (
        <ul className="freighter-reviews__list">
          {reviews.slice(0, VISIBLE_REVIEWS).map(review => (
            <li key={review.id}>
              <UserAvatar image={review.author.image} name={review.author.name} />
              <div>
                <strong>{review.author.name?.split(" ")[0] || "Usuário"}</strong>
                <span className="freighter-reviews__stars" aria-label={`${review.rating} de 5 estrelas`}>{Array.from({ length: 5 }, (_, index) => <StarIcon key={index} className={index < review.rating ? "is-filled" : undefined} />)}</span>
                <small>{formatDate(review.createdAt)}</small>
                {review.comment ? <p>{review.comment}</p> : null}
              </div>
            </li>
          ))}
        </ul>
      ) : <p>Este profissional ainda não recebeu avaliações.</p>}

      {canReview ? (
        viewerId ? (
          <details className="listing-report freighter-reviews__form" open={Boolean(status && status !== "enviada")}>
            <summary>{ownReview ? "Editar minha avaliação" : "Avaliar este freteiro"}</summary>
            <form action={submitReview.bind(null, profileId)}>
              <fieldset className="freighter-reviews__rating">
                <legend>Nota</legend>
                {[5, 4, 3, 2, 1].map(value => (
                  <label key={value}><input type="radio" name="rating" value={value} defaultChecked={ownReview?.rating === value} required /><span>{value} {value === 1 ? "estrela" : "estrelas"}</span></label>
                ))}
              </fieldset>
              <label><span>Comentário (opcional)</span><textarea name="comment" maxLength={600} rows={3} defaultValue={ownReview?.comment ?? ""} placeholder="Como foi o serviço?" /></label>
              <PendingSubmitButton pendingText="Enviando...">{ownReview ? "Atualizar avaliação" : "Publicar avaliação"}</PendingSubmitButton>
            </form>
          </details>
        ) : <p><Link href={loginHref}>Entre na sua conta</Link> para avaliar este freteiro.</p>
      ) : null}
    </section>
  );
}
