import { MoneyInput } from "@/components/money-input";
import { UTILITIES, utilityFormValue, type UtilityKey } from "@/lib/listings/property-costs";

type Initial = {
  condoFeeCents?: number | null;
  iptuCents?: number | null;
  garbageFeeCents?: number | null;
} & Partial<Record<UtilityKey, boolean | null>>;

/** Custos e contas opcionais do imóvel, usados ao publicar e ao editar. */
export function PropertyCostFields({ initial = {} }: { initial?: Initial }) {
  const hasValues = Object.values(initial).some(value => value !== null && value !== undefined);
  return (
    <details className="publish-optional-section field-wide" open={hasValues}>
      <summary>Custos e contas <span>Opcional</span></summary>
      <p className="property-costs-hint">Deixe em branco o que não souber. Use 0 para isento.</p>
      <div className="publish-optional-grid">
        <label><span>Condomínio (por mês)</span><MoneyInput name="condoFee" required={false} label="Condomínio por mês" defaultCents={initial.condoFeeCents} /></label>
        <label><span>IPTU (por ano)</span><MoneyInput name="iptu" required={false} label="IPTU por ano" defaultCents={initial.iptuCents} /></label>
        <label><span>Taxa de lixo (por ano)</span><MoneyInput name="garbageFee" required={false} label="Taxa de lixo por ano" defaultCents={initial.garbageFeeCents} /></label>
      </div>
      <p className="property-costs-hint"><strong>Só para aluguel:</strong> quem paga as contas?</p>
      <div className="publish-optional-grid">
        {UTILITIES.map(utility => (
          <label key={utility.key}>
            <span>{utility.label}</span>
            <select name={utility.field} defaultValue={utilityFormValue(initial[utility.key] ?? null)}>
              <option value="">Não informar</option>
              <option value="inquilino">Por conta do inquilino</option>
              <option value="incluso">Inclusa no aluguel</option>
            </select>
          </label>
        ))}
      </div>
    </details>
  );
}
