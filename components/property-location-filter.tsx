"use client";

import { useMemo, useState } from "react";

type NeighborhoodOption = { id: string; name: string; slug: string };
type CityOption = {
  id: string;
  name: string;
  slug: string;
  stateCode: string;
  neighborhoods: NeighborhoodOption[];
};

type PropertyLocationFilterProps = {
  cities: CityOption[];
  defaultCity?: string;
  defaultNeighborhood?: string;
};

export function PropertyLocationFilter({ cities, defaultCity = "", defaultNeighborhood = "" }: PropertyLocationFilterProps) {
  const [city, setCity] = useState(defaultCity);
  const [neighborhood, setNeighborhood] = useState(defaultNeighborhood);
  const neighborhoods = useMemo(
    () => cities.find(option => option.slug === city)?.neighborhoods ?? [],
    [cities, city],
  );

  return (
    <div className="catalog-location-filter">
      <div className="catalog-location-filter__heading">
        <strong>Localização</strong>
        <small>Escolha primeiro a cidade para ver somente os bairros dela.</small>
      </div>
      <label className="catalog-filter-section">
        <span><b>1</b> Cidade</span>
        <select
          name="cidade"
          value={city}
          onChange={(event) => {
            setCity(event.target.value);
            setNeighborhood("");
          }}
        >
          <option value="">Selecione uma cidade</option>
          {cities.map(option => <option key={option.id} value={option.slug}>{option.name} — {option.stateCode}</option>)}
        </select>
      </label>
      <label className="catalog-filter-section">
        <span><b>2</b> Bairro</span>
        <select name="bairro" value={neighborhood} onChange={event => setNeighborhood(event.target.value)} disabled={!city}>
          <option value="">{city ? "Todos os bairros" : "Selecione a cidade primeiro"}</option>
          {neighborhoods.map(option => <option key={option.id} value={option.slug}>{option.name}</option>)}
        </select>
      </label>
    </div>
  );
}
