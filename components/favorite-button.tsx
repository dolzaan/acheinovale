import { toggleFavorite, type FavoriteKind } from "@/app/favoritos/actions";
import { HeartIcon } from "@/components/icons";
import { PendingSubmitButton } from "@/components/pending-submit-button";

/** Botão de salvar/remover dos favoritos. Visitantes sem login são levados ao login. */
export function FavoriteButton({ kind, id, saved }: { kind: FavoriteKind; id: string; saved: boolean }) {
  return (
    <form action={toggleFavorite.bind(null, kind, id)} className="favorite-form">
      <PendingSubmitButton
        className={`favorite-button${saved ? " is-saved" : ""}`}
        pendingText={saved ? "Removendo..." : "Salvando..."}
        aria-pressed={saved}
      >
        <HeartIcon size={18} />
        <span>{saved ? "Salvo nos favoritos" : "Salvar nos favoritos"}</span>
      </PendingSubmitButton>
    </form>
  );
}
