"use client";

export type NeighborhoodValue = { id: string; name: string; custom: boolean };

export const EMPTY_NEIGHBORHOOD: NeighborhoodValue = { id: "", name: "", custom: false };

type Props = {
  neighborhoods: Array<{ id: string; name: string }>;
  value: NeighborhoodValue;
  onChange: (value: NeighborhoodValue) => void;
  disabled?: boolean;
};

/** Seleção de bairro com opção "Outro bairro", que envia o nome para revisão. */
export function NeighborhoodPicker({ neighborhoods, value, onChange, disabled = false }: Props) {
  return (
    <>
      <label className="property-neighborhood-field">
        <span>Bairro</span>
        <select
          value={value.custom ? "__other__" : value.id}
          disabled={disabled}
          onChange={event => {
            if (event.target.value === "__other__") {
              onChange({ id: "", name: "", custom: true });
              return;
            }
            const neighborhood = neighborhoods.find(item => item.id === event.target.value);
            onChange({ id: neighborhood?.id ?? "", name: neighborhood?.name ?? "", custom: false });
          }}
          required
        >
          <option value="">{disabled ? "Selecione a cidade primeiro" : "Selecione o bairro"}</option>
          {neighborhoods.map(neighborhood => <option key={neighborhood.id} value={neighborhood.id}>{neighborhood.name}</option>)}
          <option value="__other__">Outro bairro (digitar)</option>
        </select>
        <input type="hidden" name="neighborhoodId" value={value.id} />
        <input type="hidden" name="neighborhoodName" value={value.name} />
        <small>Não encontrou? Escolha “Outro bairro (digitar)”.</small>
      </label>
      {value.custom ? (
        <label className="property-neighborhood-field property-neighborhood-field--custom">
          <span>Nome do bairro</span>
          <input value={value.name} maxLength={80} autoComplete="address-level3" placeholder="Digite o nome do bairro" onChange={event => onChange({ ...value, name: event.target.value })} required />
          <small className="property-neighborhood-field__new">Será enviado para revisão antes de entrar na lista oficial.</small>
        </label>
      ) : null}
    </>
  );
}
