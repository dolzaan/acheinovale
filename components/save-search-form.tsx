import Link from "next/link";
import { createSavedSearch } from "@/app/alertas/actions";
import { PendingSubmitButton } from "@/components/pending-submit-button";

export type SaveSearchCriteria = {
  cidade?: string;
  bairro?: string;
  finalidade?: string;
  tipo?: string;
  precoMin?: string;
  precoMax?: string;
  quartos?: string;
};

const statusMessages: Record<string, { kind: "success" | "error"; text: string }> = {
  criado: { kind: "success", text: "Alerta criado. Você vai receber no máximo um e-mail por dia com imóveis novos desta busca." },
  existe: { kind: "success", text: "Você já tem um alerta para esta busca." },
  maximo: { kind: "error", text: "Você atingiu o limite de alertas ativos. Remova algum em Meus alertas." },
  limite: { kind: "error", text: "Muitas tentativas em pouco tempo. Tente novamente mais tarde." },
  erro: { kind: "error", text: "Marque a autorização para receber os e-mails." },
};

/** Salva os filtros atuais do catálogo como um alerta de e-mail. */
export function SaveSearchForm({ criteria, backPath, status }: { criteria: SaveSearchCriteria; backPath: string; status?: string }) {
  const message = status ? statusMessages[status] : undefined;
  return (
    <section className="save-search" aria-label="Alerta de imóveis novos">
      {message ? <p className={message.kind === "success" ? "form-success" : "form-alert"} role="status">{message.text} {status === "criado" || status === "maximo" ? <Link href="/alertas">Ver meus alertas</Link> : null}</p> : null}
      <details className="save-search__details">
        <summary>Criar alerta para esta busca</summary>
        <form action={createSavedSearch}>
          <input type="hidden" name="voltar" value={backPath} />
          {Object.entries(criteria).map(([name, value]) => value ? <input key={name} type="hidden" name={name} value={value} /> : null)}
          <p>Avisamos por e-mail quando aparecerem imóveis novos com estes filtros, em no máximo um e-mail por dia. Você pode cancelar a qualquer momento.</p>
          <label className="checkbox-field"><input type="checkbox" name="consentimento" value="1" required /><span>Quero receber e-mails com imóveis novos desta busca</span></label>
          <PendingSubmitButton className="button button--primary" pendingText="Criando alerta...">Criar alerta</PendingSubmitButton>
        </form>
      </details>
    </section>
  );
}
