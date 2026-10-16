import { PendingSubmitButton } from "@/components/pending-submit-button";

type Props = {
  action: (formData: FormData) => Promise<void>;
  reasons: readonly string[];
  summary: string;
  status?: string;
};

/** Formulário de denúncia exibido no cartão de contato dos anúncios. */
export function ListingReportForm({ action, reasons, summary, status }: Props) {
  return (
    <>
      {status === "enviada" ? <p className="listing-report-success" role="status">Obrigado. A denúncia foi enviada para análise.</p> : null}
      {status === "limite" ? <p className="listing-report-error" role="alert">Limite diário de denúncias atingido.</p> : null}
      {status === "erro" ? <p className="listing-report-error" role="alert">Não foi possível enviar essa denúncia.</p> : null}
      <details className="listing-report">
        <summary>{summary}</summary>
        <form action={action}>
          <label><span>Motivo</span><select name="reason" required defaultValue=""><option value="" disabled>Selecione</option>{reasons.map(reason => <option key={reason}>{reason}</option>)}</select></label>
          <label><span>Detalhes (opcional)</span><textarea name="details" maxLength={500} rows={3} /></label>
          <PendingSubmitButton pendingText="Enviando...">Enviar denúncia</PendingSubmitButton>
        </form>
      </details>
    </>
  );
}
