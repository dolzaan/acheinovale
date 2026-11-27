import { MoneyInput } from "@/components/money-input";
import { FEES, feePeriodFormValue, UTILITIES, utilityFormValue, type FeeKey, type FeePeriodKey, type UtilityKey } from "@/lib/listings/property-costs";

type Initial = Partial<Record<FeeKey, number | null>>
  & Partial<Record<FeePeriodKey, string | null>>
  & Partial<Record<UtilityKey, boolean | null>>;

/** Custos e contas opcionais do imóvel, usados ao publicar e ao editar. */
export function PropertyCostFields({ initial = {} }: { initial?: Initial }) {
  const hasValues = Object.values(initial).some(value => value !== null && value !== undefined);
  return (
    <details className="publish-optional-section field-wide" open={hasValues}>
      <summary>Custos e contas <span>Opcional</span></summary>
      <p className="property-costs-hint">Deixe em branco o que não souber. Use 0 para isento e escolha se o valor é por mês ou por ano.</p>
      <div className="publish-optional-grid">
        {FEES.map(fee => (
          <div className="property-fee-field" key={fee.key}>
            <label htmlFor={`fee-${fee.field}`}>{fee.label}</label>
            <div className="property-fee-field__row">
              <MoneyInput id={`fee-${fee.field}`} name={fee.field} required={false} label={fee.label} defaultCents={initial[fee.key]} />
              <select name={fee.periodField} aria-label={`${fee.label}: período do valor`} defaultValue={feePeriodFormValue(initial[fee.periodKey], fee.defaultPeriod)}>
                <option value="mes">por mês</option>
                <option value="ano">por ano</option>
              </select>
            </div>
          </div>
        ))}
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
