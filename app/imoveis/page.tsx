import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Form from "next/form";
import type { Prisma, PropertyType } from "@prisma/client";
import { Header } from "@/components/header";
import { MobileNav } from "@/components/mobile-nav";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { PropertyLocationFilter } from "@/components/property-location-filter";
import { BathIcon, BedIcon, FilterIcon, HomeIcon, PinIcon, SearchIcon } from "@/components/icons";
import { prisma } from "@/lib/db";
import { propertyUrl } from "@/lib/listings/urls";
import { parsePropertySearch } from "@/lib/search/property-search";
import { propertyImagePublicUrl } from "@/lib/supabase/storage";

export const metadata: Metadata = {
  title: "Imóveis em Rio do Sul | AcheiNoVale",
  description: "Casas, apartamentos, terrenos e imóveis para venda ou aluguel em Rio do Sul e região.",
  alternates: { canonical: "https://acheinovale.vercel.app/imoveis" },
};

type SearchParams = {
  q?: string;
  finalidade?: string;
  tipo?: string;
  cidade?: string;
  bairro?: string;
  precoMin?: string;
  precoMax?: string;
  quartos?: string;
  banheiros?: string;
  vagas?: string;
  areaMin?: string;
  pets?: string;
  mobiliado?: string;
  ordem?: string;
};

type Props = { searchParams: Promise<SearchParams> };

type RankedPropertyRow = {
  id: string;
  relevancia: number;
  total_resultados: bigint;
};

const propertyTypes: Array<{ value: PropertyType; label: string }> = [
  { value: "HOUSE", label: "Casa" },
  { value: "APARTMENT", label: "Apartamento" },
  { value: "STUDIO", label: "Kitnet / Studio" },
  { value: "LAND", label: "Terreno" },
  { value: "COMMERCIAL_ROOM", label: "Sala comercial" },
  { value: "WAREHOUSE", label: "Galpão" },
  { value: "OTHER", label: "Outro" },
];

const validPropertyTypes = new Set<PropertyType>(propertyTypes.map(({ value }) => value));
const propertyTypeLabels = new Map<PropertyType, string>(propertyTypes.map(({ value, label }) => [value, label]));

function parseNatural(value: string | undefined, maximum: number) {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= maximum ? parsed : undefined;
}

function parseMoney(value: string | undefined) {
  if (!value) return undefined;
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 100_000_000
    ? Math.round(parsed * 100)
    : undefined;
}

function buildFilterUrl(params: SearchParams, changes: Partial<SearchParams>) {
  const next = new URLSearchParams();
  Object.entries({ ...params, ...changes }).forEach(([key, value]) => {
    if (value) next.set(key, value);
  });
  const query = next.toString();
  return query ? `/imoveis?${query}` : "/imoveis";
}

function formatPrice(priceCents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(priceCents / 100);
}

export default async function PropertiesPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = params.q?.trim().slice(0, 80) || "";
  const cities = await prisma.city.findMany({
    where: { isActive: true },
    include: { neighborhoods: { orderBy: { name: "asc" } } },
    orderBy: { name: "asc" },
  });
  const selectedCity = params.cidade ? cities.find(city => city.slug === params.cidade) : undefined;
  const neighborhoods = selectedCity?.neighborhoods ?? cities.flatMap(city => city.neighborhoods);
  const selectedNeighborhood = selectedCity && params.bairro
    ? selectedCity.neighborhoods.find(neighborhood => neighborhood.slug === params.bairro)
    : undefined;
  const searchIntent = parsePropertySearch(query, neighborhoods);
  const explicitPurpose = params.finalidade === "aluguel" ? "RENT" : params.finalidade === "venda" ? "SALE" : undefined;
  const explicitType = validPropertyTypes.has(params.tipo as PropertyType) ? params.tipo as PropertyType : undefined;
  const purpose = explicitPurpose || searchIntent.purpose;
  const type = explicitType || searchIntent.type;
  const explicitMinimumPrice = parseMoney(params.precoMin);
  const explicitMaximumPrice = parseMoney(params.precoMax);
  const minimumPrice = explicitMinimumPrice ?? searchIntent.minimumPriceCents;
  const maximumPrice = explicitMaximumPrice ?? searchIntent.maximumPriceCents;
  const explicitMinimumBedrooms = parseNatural(params.quartos, 30);
  const minimumBedrooms = explicitMinimumBedrooms ?? searchIntent.minimumBedrooms;
  const explicitMinimumBathrooms = parseNatural(params.banheiros, 30);
  const minimumBathrooms = explicitMinimumBathrooms ?? searchIntent.minimumBathrooms;
  const explicitMinimumParkingSpots = parseNatural(params.vagas, 30);
  const minimumParkingSpots = explicitMinimumParkingSpots ?? searchIntent.minimumParkingSpots;
  const explicitMinimumArea = parseNatural(params.areaMin, 100_000);
  const minimumArea = explicitMinimumArea ?? searchIntent.minimumAreaM2;
  const acceptsPets = params.pets === "1" || searchIntent.acceptsPets === true;
  const furnished = params.mobiliado === "1" || searchIntent.furnished === true;
  const explicitNeighborhoodId = selectedNeighborhood?.id;
  const neighborhoodId = explicitNeighborhoodId || searchIntent.neighborhoodIds.at(0);
  const order = params.ordem === "preco-menor" || params.ordem === "preco-maior" ? params.ordem : "recentes";
  const priceFilter = minimumPrice !== undefined || maximumPrice !== undefined
    ? { ...(minimumPrice !== undefined ? { gte: minimumPrice } : {}), ...(maximumPrice !== undefined ? { lte: maximumPrice } : {}) }
    : undefined;
  const where: Prisma.PropertyWhereInput = {
    status: "ACTIVE",
    city: { isActive: true, ...(selectedCity ? { id: selectedCity.id } : {}) },
    ...(purpose ? { purpose } : {}),
    ...(type ? { type } : {}),
    ...(selectedNeighborhood
      ? { neighborhoodId: selectedNeighborhood.id }
      : searchIntent.neighborhoodIds.length
        ? { neighborhoodId: { in: searchIntent.neighborhoodIds } }
        : {}),
    ...(priceFilter ? { priceCents: priceFilter } : {}),
    ...(minimumBedrooms !== undefined ? { bedrooms: { gte: minimumBedrooms } } : {}),
    ...(minimumBathrooms !== undefined ? { bathrooms: { gte: minimumBathrooms } } : {}),
    ...(minimumParkingSpots !== undefined ? { parkingSpots: { gte: minimumParkingSpots } } : {}),
    ...(minimumArea !== undefined ? { areaM2: { gte: minimumArea } } : {}),
    ...(acceptsPets ? { acceptsPets: true } : {}),
    ...(furnished ? { furnished: true } : {}),
  };
  const orderBy: Prisma.PropertyOrderByWithRelationInput[] = order === "preco-menor"
    ? [{ priceCents: "asc" }, { createdAt: "desc" }]
    : order === "preco-maior"
      ? [{ priceCents: "desc" }, { createdAt: "desc" }]
      : [{ publishedAt: "desc" }, { createdAt: "desc" }];
  const [properties, resultCount] = query
    ? await (async () => {
      const rankedRows = await prisma.$queryRaw<RankedPropertyRow[]>`
        SELECT id, relevancia, total_resultados
        FROM private.buscar_imoveis(
          ${searchIntent.freeTerms.join(" ")}::text,
          ${selectedCity?.id ?? null}::text,
          ${purpose ?? null}::text,
          ${type ?? null}::text,
          ${neighborhoodId ?? null}::text,
          ${minimumPrice ?? null}::integer,
          ${maximumPrice ?? null}::integer,
          ${minimumBedrooms ?? null}::integer,
          ${minimumBathrooms ?? null}::integer,
          ${minimumParkingSpots ?? null}::integer,
          ${minimumArea ?? null}::numeric,
          ${acceptsPets ? true : null}::boolean,
          ${furnished ? true : null}::boolean,
          200::integer
        )
      `;
      const rankedIds = rankedRows.map(row => row.id);
      const rankedPosition = new Map(rankedIds.map((id, index) => [id, index]));
      const items = rankedIds.length
        ? await prisma.property.findMany({
          where: { id: { in: rankedIds } },
          include: { city: true, neighborhood: true, images: { orderBy: { position: "asc" }, take: 1 } },
        })
        : [];

      items.sort((first, second) => {
        if (order === "preco-menor") {
          return first.priceCents - second.priceCents || second.createdAt.getTime() - first.createdAt.getTime();
        }
        if (order === "preco-maior") {
          return second.priceCents - first.priceCents || second.createdAt.getTime() - first.createdAt.getTime();
        }
        return (rankedPosition.get(first.id) ?? Number.MAX_SAFE_INTEGER)
          - (rankedPosition.get(second.id) ?? Number.MAX_SAFE_INTEGER);
      });

      return [items.slice(0, 48), Number(rankedRows[0]?.total_resultados ?? 0)] as const;
    })()
    : await Promise.all([
      prisma.property.findMany({
        where,
        include: { city: true, neighborhood: true, images: { orderBy: { position: "asc" }, take: 1 } },
        orderBy,
        take: 48,
      }),
      prisma.property.count({ where }),
    ]);
  const advancedFilterCount = [
    explicitType,
    selectedCity,
    selectedNeighborhood,
    explicitMinimumPrice !== undefined,
    explicitMaximumPrice !== undefined,
    explicitMinimumBedrooms !== undefined,
    explicitMinimumBathrooms !== undefined,
    explicitMinimumParkingSpots !== undefined,
    explicitMinimumArea !== undefined,
    params.pets === "1",
    params.mobiliado === "1",
  ].filter(Boolean).length;
  const hasFilters = Boolean(query || purpose || advancedFilterCount || order !== "recentes");
  const sortFields = [
    ["q", query],
    ["finalidade", params.finalidade],
    ["tipo", explicitType],
    ["cidade", selectedCity?.slug],
    ["bairro", selectedNeighborhood?.slug],
    ["precoMin", explicitMinimumPrice !== undefined ? String(explicitMinimumPrice / 100) : undefined],
    ["precoMax", explicitMaximumPrice !== undefined ? String(explicitMaximumPrice / 100) : undefined],
    ["quartos", explicitMinimumBedrooms !== undefined ? String(explicitMinimumBedrooms) : undefined],
    ["banheiros", explicitMinimumBathrooms !== undefined ? String(explicitMinimumBathrooms) : undefined],
    ["vagas", explicitMinimumParkingSpots !== undefined ? String(explicitMinimumParkingSpots) : undefined],
    ["areaMin", explicitMinimumArea !== undefined ? String(explicitMinimumArea) : undefined],
    ["pets", params.pets === "1" ? "1" : undefined],
    ["mobiliado", params.mobiliado === "1" ? "1" : undefined],
  ].filter((field): field is [string, string] => Boolean(field[1]));

  return <><Header/><main className="catalog-page"><div className="container catalog-container">
    <div className="catalog-heading"><div><span className="section-kicker">Rio do Sul e região</span><h1>Imóveis</h1><p>Encontre casas, apartamentos e terrenos publicados por pessoas da região.</p></div><Link className="button button--primary" href="/publicar/imovel">Anunciar imóvel</Link></div>
    <Form className="catalog-filter catalog-filter--properties" action="/imoveis">
      <label className="catalog-filter__search"><SearchIcon size={19}/><input name="q" defaultValue={query} placeholder="Bairro, imóvel ou característica" aria-label="Buscar imóveis"/></label>
      <select name="finalidade" defaultValue={params.finalidade || ""} aria-label="Finalidade"><option value="">Comprar ou alugar</option><option value="venda">Comprar</option><option value="aluguel">Alugar</option></select>
      <details className="catalog-more-filters">
        <summary><FilterIcon/><span>Mais filtros</span>{advancedFilterCount > 0 ? <b>{advancedFilterCount}</b> : null}</summary>
        <div className="catalog-more-filters__panel">
          <PropertyLocationFilter cities={cities.map(city => ({ id: city.id, name: city.name, slug: city.slug, stateCode: city.stateCode, neighborhoods: city.neighborhoods.map(neighborhood => ({ id: neighborhood.id, name: neighborhood.name, slug: neighborhood.slug })) }))} defaultCity={selectedCity?.slug} defaultNeighborhood={selectedNeighborhood?.slug}/>
          <div className="catalog-filter-section catalog-filter-section--wide"><strong>Faixa de preço</strong><div className="catalog-filter__pair"><label><span>Valor mínimo</span><div className="catalog-money-input"><small>R$</small><input name="precoMin" type="number" min="0" step="100" defaultValue={minimumPrice !== undefined ? minimumPrice / 100 : ""} placeholder="0"/></div></label><label><span>Valor máximo</span><div className="catalog-money-input"><small>R$</small><input name="precoMax" type="number" min="0" step="100" defaultValue={maximumPrice !== undefined ? maximumPrice / 100 : ""} placeholder="Sem limite"/></div></label></div></div>
          <label className="catalog-filter-section"><strong>Tipo de imóvel</strong><select name="tipo" defaultValue={explicitType || ""}><option value="">Todos os tipos</option>{propertyTypes.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          <label className="catalog-filter-section"><strong>Quartos</strong><select name="quartos" defaultValue={explicitMinimumBedrooms ?? ""}><option value="">Qualquer</option><option value="1">1 ou mais</option><option value="2">2 ou mais</option><option value="3">3 ou mais</option><option value="4">4 ou mais</option></select></label>
          <label className="catalog-filter-section"><strong>Banheiros</strong><select name="banheiros" defaultValue={minimumBathrooms ?? ""}><option value="">Qualquer</option><option value="1">1 ou mais</option><option value="2">2 ou mais</option><option value="3">3 ou mais</option><option value="4">4 ou mais</option></select></label>
          <label className="catalog-filter-section"><strong>Vagas</strong><select name="vagas" defaultValue={minimumParkingSpots ?? ""}><option value="">Qualquer</option><option value="1">1 ou mais</option><option value="2">2 ou mais</option><option value="3">3 ou mais</option><option value="4">4 ou mais</option></select></label>
          <label className="catalog-filter-section"><strong>Área mínima</strong><div className="catalog-area-input"><input name="areaMin" type="number" min="0" step="1" defaultValue={minimumArea ?? ""} placeholder="Ex: 80"/><small>m²</small></div></label>
          <div className="catalog-filter-section catalog-filter-section--checks"><strong>Comodidades</strong><label><input type="checkbox" name="pets" value="1" defaultChecked={acceptsPets}/><span>Aceita pets</span></label><label><input type="checkbox" name="mobiliado" value="1" defaultChecked={furnished}/><span>Mobiliado</span></label></div>
          <div className="catalog-filter-actions">{hasFilters ? <Link href="/imoveis">Limpar tudo</Link> : <span/>}<PendingSubmitButton className="button button--primary" pendingText="Aplicando filtros..." navigation>Mostrar resultados</PendingSubmitButton></div>
        </div>
      </details>
      <PendingSubmitButton className="button button--primary catalog-search-button" pendingText="Buscando..." navigation>Buscar</PendingSubmitButton>
      <input type="hidden" name="ordem" value={order}/>
    </Form>
    <nav className="catalog-quick-filters" aria-label="Filtros rápidos">
      <Link className={explicitPurpose === "SALE" ? "is-active" : ""} href={buildFilterUrl(params, { finalidade: explicitPurpose === "SALE" ? undefined : "venda" })}>Comprar</Link>
      <Link className={explicitPurpose === "RENT" ? "is-active" : ""} href={buildFilterUrl(params, { finalidade: explicitPurpose === "RENT" ? undefined : "aluguel" })}>Alugar</Link>
      <Link className={explicitMinimumBedrooms === 2 ? "is-active" : ""} href={buildFilterUrl(params, { quartos: explicitMinimumBedrooms === 2 ? undefined : "2" })}>2+ quartos</Link>
      <Link className={explicitMinimumBedrooms === 3 ? "is-active" : ""} href={buildFilterUrl(params, { quartos: explicitMinimumBedrooms === 3 ? undefined : "3" })}>3+ quartos</Link>
      <Link className={params.pets === "1" ? "is-active" : ""} href={buildFilterUrl(params, { pets: params.pets === "1" ? undefined : "1" })}>Aceita pets</Link>
      <Link className={params.mobiliado === "1" ? "is-active" : ""} href={buildFilterUrl(params, { mobiliado: params.mobiliado === "1" ? undefined : "1" })}>Mobiliado</Link>
    </nav>
    <div className="catalog-results-bar"><p><strong>{resultCount}</strong> {resultCount === 1 ? "imóvel encontrado" : "imóveis encontrados"}</p><Form action="/imoveis">{sortFields.map(([name, value]) => <input key={name} type="hidden" name={name} value={value}/>) }<label><span>Ordenar por</span><select name="ordem" defaultValue={order}><option value="recentes">Mais recentes</option><option value="preco-menor">Menor preço</option><option value="preco-maior">Maior preço</option></select></label><PendingSubmitButton pendingText="Ordenando..." navigation>Ordenar</PendingSubmitButton></Form></div>
    {properties.length ? <div className="property-grid catalog-grid">{properties.map(property => <article className="property-card" key={property.id}><Link className={property.images[0] ? "catalog-property-image" : "catalog-image-placeholder"} href={propertyUrl(property)} aria-label={`Ver ${property.title}`}>{property.images[0] ? <Image src={propertyImagePublicUrl(property.images[0].storageKey)} alt={property.images[0].altText || property.title} fill sizes="(max-width: 680px) 82vw, 33vw" /> : <><HomeIcon size={42}/><span>Ver imóvel</span></>}</Link><div className="property-card__body"><span className="property-card__purpose">{property.purpose === "RENT" ? "Aluguel" : "Venda"} · {propertyTypeLabels.get(property.type)}</span><span className="property-card__location"><PinIcon size={15}/>{property.neighborhood.name}, {property.city.name}</span><h3><Link href={propertyUrl(property)}>{property.title}</Link></h3><div className="property-card__features">{property.bedrooms !== null ? <span><BedIcon/>{property.bedrooms} quartos</span> : null}{property.bathrooms !== null ? <span><BathIcon/>{property.bathrooms} banh.</span> : null}{property.areaM2 ? <span>{property.areaM2.toString()} m²</span> : null}</div><div className="property-card__price"><strong>{formatPrice(property.priceCents)}</strong><span>{property.purpose === "RENT" ? "/mês" : ""}</span></div><small className="catalog-code">{property.publicCode.toUpperCase()}</small></div></article>)}</div> : <div className="empty-state catalog-empty"><strong>Nenhum imóvel encontrado.</strong><p>{hasFilters ? "Tente remover alguns filtros para ampliar a busca." : "Os anúncios aprovados aparecerão aqui. Publique o primeiro imóvel."}</p>{hasFilters ? <Link className="button button--secondary" href="/imoveis">Limpar filtros</Link> : <Link className="button button--primary" href="/publicar/imovel">Publicar imóvel</Link>}</div>}
  </div></main><MobileNav/></>;
}
