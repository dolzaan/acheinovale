"use client";

import { useState } from "react";
import { lookupPropertyCep } from "@/app/publicar/imovel/actions";
import { updatePropertyDetails } from "@/app/meus-anuncios/[id]/editar/actions";
import { MoneyInput } from "@/components/money-input";
import { NeighborhoodPicker, EMPTY_NEIGHBORHOOD, type NeighborhoodValue } from "@/components/neighborhood-picker";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { PhoneInput } from "@/components/phone-input";

type CityOption = {
  id: string;
  name: string;
  stateCode: string;
  neighborhoods: Array<{ id: string; name: string }>;
};

export type PropertyEditValues = {
  title: string;
  description: string;
  purpose: string;
  type: string;
  priceCents: number;
  whatsapp: string;
  bedrooms: number | null;
  bathrooms: number | null;
  parkingSpots: number | null;
  cityId: string;
  neighborhood: { id: string; name: string };
  cep: string;
  street: string;
  addressNumber: string;
  addressComplement: string;
};

const PROPERTY_TYPES = [
  ["HOUSE", "Casa"],
  ["APARTMENT", "Apartamento"],
  ["STUDIO", "Kitnet / Studio"],
  ["LAND", "Terreno"],
  ["COMMERCIAL_ROOM", "Sala comercial"],
  ["WAREHOUSE", "Galpão"],
  ["OTHER", "Outro"],
] as const;

function formatCep(value: string) {
  return value.replace(/\D/g, "").slice(0, 8).replace(/^(\d{5})(\d)/, "$1-$2");
}

export function PropertyEditForm({ propertyId, cities, initial }: { propertyId: string; cities: CityOption[]; initial: PropertyEditValues }) {
  const [cityId, setCityId] = useState(initial.cityId);
  const [neighborhood, setNeighborhood] = useState<NeighborhoodValue>({ ...initial.neighborhood, custom: false });
  const [extraNeighborhood, setExtraNeighborhood] = useState<{ id: string; name: string; cityId: string } | null>({ ...initial.neighborhood, cityId: initial.cityId });
  const [cep, setCep] = useState(formatCep(initial.cep));
  const [street, setStreet] = useState(initial.street);
  const [addressComplement, setAddressComplement] = useState(initial.addressComplement);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepStatus, setCepStatus] = useState<{ kind: "success" | "error"; message: string } | null>(null);

  // O bairro atual ou o vindo do CEP pode não estar na lista oficial (ex.: aguardando revisão).
  const stored = cities.find(city => city.id === cityId)?.neighborhoods ?? [];
  const neighborhoods = extraNeighborhood && extraNeighborhood.cityId === cityId && !stored.some(item => item.id === extraNeighborhood.id)
    ? [...stored, { id: extraNeighborhood.id, name: extraNeighborhood.name }].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
    : stored;

  async function consultCep() {
    if (cepLoading) return;
    setCepLoading(true);
    setCepStatus(null);
    try {
      const result = await lookupPropertyCep(cep);
      if (!result.ok) {
        setCepStatus({ kind: "error", message: result.message });
        return;
      }
      setCep(formatCep(result.cep));
      setCityId(result.city.id);
      setStreet(result.street);
      setAddressComplement(result.complement);
      if (result.neighborhood) {
        setExtraNeighborhood({ ...result.neighborhood, cityId: result.city.id });
        setNeighborhood({ ...result.neighborhood, custom: false });
      } else {
        setNeighborhood(EMPTY_NEIGHBORHOOD);
      }
      setCepStatus({ kind: "success", message: result.message });
    } catch {
      setCepStatus({ kind: "error", message: "Não foi possível consultar o CEP agora. Tente novamente." });
    } finally {
      setCepLoading(false);
    }
  }

  return (
    <form className="listing-form" action={updatePropertyDetails.bind(null, propertyId)}>
      <p className="required-fields-note field-wide"><span aria-hidden="true">*</span> Campos obrigatórios</p>
      <label className="field-wide"><span>Título</span><input name="title" defaultValue={initial.title} minLength={8} maxLength={120} required /></label>
      <label><span>Finalidade</span><select name="purpose" defaultValue={initial.purpose} required><option value="RENT">Aluguel</option><option value="SALE">Venda</option></select></label>
      <label><span>Tipo</span><select name="type" defaultValue={initial.type} required>{PROPERTY_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>

      <div className="field-wide property-address-heading">
        <strong>Onde fica o imóvel?</strong>
        <span>O anúncio mostra apenas a cidade e o bairro.</span>
      </div>
      <label><span>Cidade</span><select name="cityId" value={cityId} onChange={event => { setCityId(event.target.value); setNeighborhood(EMPTY_NEIGHBORHOOD); setCepStatus(null); }} required><option value="">Selecione a cidade</option>{cities.map(city => <option key={city.id} value={city.id}>{city.name} — {city.stateCode}</option>)}</select></label>
      <NeighborhoodPicker neighborhoods={neighborhoods} value={neighborhood} onChange={setNeighborhood} disabled={!cityId} />

      <label><span>Preço</span><MoneyInput defaultCents={initial.priceCents} /></label>
      <label><span>WhatsApp do anúncio</span><PhoneInput name="whatsapp" defaultValue={initial.whatsapp} /></label>
      <label className="field-wide"><span>Descrição</span><textarea name="description" defaultValue={initial.description} minLength={30} maxLength={3000} rows={6} required /></label>

      <div className="publish-optional-grid">
        <label><span>Quartos</span><input name="bedrooms" type="number" min="0" max="30" defaultValue={initial.bedrooms ?? ""} /></label>
        <label><span>Banheiros</span><input name="bathrooms" type="number" min="0" max="30" defaultValue={initial.bathrooms ?? ""} /></label>
        <label><span>Vagas</span><input name="parkingSpots" type="number" min="0" max="30" defaultValue={initial.parkingSpots ?? ""} /></label>
      </div>

      <details className="publish-optional-section field-wide" open={Boolean(initial.cep)}>
        <summary>Endereço detalhado <span>Opcional</span></summary>
        <p>Esses dados ficam privados e não aparecem no anúncio público. Deixe o CEP em branco para remover o endereço salvo.</p>
        <label className="property-cep-field"><span>CEP</span><div><input name="cep" value={cep} inputMode="numeric" autoComplete="postal-code" maxLength={9} placeholder="00000-000" onChange={event => { setCep(formatCep(event.target.value)); setCepStatus(null); }} /><button type="button" onClick={() => void consultCep()} disabled={cepLoading}>{cepLoading ? "Consultando..." : "Buscar CEP"}</button></div></label>
        <label><span>Rua</span><input name="street" value={street} onChange={event => setStreet(event.target.value)} maxLength={160} autoComplete="address-line1" /></label>
        <label><span>Número</span><input name="addressNumber" defaultValue={initial.addressNumber} maxLength={20} autoComplete="address-line2" placeholder="Ex: 120 ou S/N" /></label>
        <label className="field-wide"><span>Complemento</span><input name="addressComplement" value={addressComplement} onChange={event => setAddressComplement(event.target.value)} maxLength={120} /></label>
        {cepStatus ? <p className={`property-cep-status property-cep-status--${cepStatus.kind} field-wide`} role="status">{cepStatus.message}</p> : null}
      </details>

      <p className="property-privacy-note field-wide">Alterações em título, descrição, preço, características, bairro ou WhatsApp fazem o anúncio voltar para análise antes de aparecer de novo. O código do anúncio é mantido.</p>
      <PendingSubmitButton className="button button--primary field-wide" pendingText="Salvando alterações...">Salvar alterações</PendingSubmitButton>
    </form>
  );
}
