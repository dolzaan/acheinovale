/** Campo opcional da cota de enchente, usado ao publicar e ao editar um imóvel. */
export function FloodLevelField({ defaultValue = "" }: { defaultValue?: string }) {
  return (
    <label className="flood-level-field">
      <span>Cota de enchente</span>
      <input
        name="floodLevel"
        type="text"
        inputMode="decimal"
        defaultValue={defaultValue}
        placeholder="Ex.: 12,5"
        pattern="\d{1,2}([,.]\d{1,2})?(\s*[mM])?"
        title="Informe a cota em metros, por exemplo 12,5"
        maxLength={8}
        aria-describedby="flood-level-hint"
      />
      <small id="flood-level-hint">Nível do rio, em metros, em que a água chega ao imóvel. Deixe em branco se não souber.</small>
    </label>
  );
}
