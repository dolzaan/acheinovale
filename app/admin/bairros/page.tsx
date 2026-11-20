import Link from "next/link";
import { Header } from "@/components/header";
import { MobileNav } from "@/components/mobile-nav";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { requireAdmin } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db";
import { loadNeighborhoodSuggestions, type NeighborhoodSuggestion, type NeighborhoodSuggestionKind } from "@/lib/location/neighborhood-sources";
import { createNeighborhood, importNeighborhoods, updateNeighborhood } from "./actions";

// A consulta ao OpenStreetMap pode levar dezenas de segundos em cidades grandes.
export const maxDuration = 60;

type Props = { searchParams: Promise<{ cidade?: string; concluido?: string; erro?: string; importar?: string; quantidade?: string }> };

const suggestionLabels: Record<NeighborhoodSuggestionKind, string> = {
  official: "Bairro oficial",
  neighborhood: "Bairro",
  rural: "Localidade rural",
  subdivision: "Loteamento ou vila",
};

function suggestionLabel(suggestion: NeighborhoodSuggestion) {
  return `${suggestionLabels[suggestion.kind]} · ${suggestion.source === "prefeitura" ? "Prefeitura" : "OpenStreetMap"}`;
}

function successMessage(params: { concluido?: string; quantidade?: string }) {
  if (params.concluido === "criado") return "Bairro adicionado à lista.";
  if (params.concluido === "importados") {
    const count = Number(params.quantidade) || 0;
    return count === 1 ? "1 bairro adicionado à lista." : `${count} bairros adicionados à lista.`;
  }
  return "Bairro atualizado ou mesclado.";
}

export default async function NeighborhoodAdminPage({ searchParams }: Props) {
  await requireAdmin("/admin/bairros");
  const params = await searchParams;
  const cities = await prisma.city.findMany({ where: { isActive: true }, select: { id: true, name: true, slug: true, stateCode: true, ibgeCode: true }, orderBy: { name: "asc" } });
  const selectedCity = cities.find(city => city.slug === params.cidade) ?? cities.find(city => city.slug === "rio-do-sul") ?? cities[0];
  const neighborhoods = selectedCity ? await prisma.neighborhood.findMany({
    where: { cityId: selectedCity.id },
    include: { _count: { select: { properties: true } } },
    orderBy: [{ needsReview: "desc" }, { name: "asc" }],
  }) : [];
  const result = selectedCity && params.importar === "1" ? await loadNeighborhoodSuggestions(selectedCity) : null;
  const existingSlugs = new Set(neighborhoods.map(neighborhood => neighborhood.slug));
  const newSuggestions = result ? result.suggestions.filter(suggestion => !existingSlugs.has(suggestion.slug)) : [];

  return <><Header citySlug={selectedCity?.slug}/><main id="conteudo" className="account-page admin-page"><div className="container admin-shell">
    <div className="account-heading admin-heading"><span className="section-kicker">Localizações</span><h1>Gerenciar bairros</h1><p>Cadastre bairros oficiais, corrija nomes e aprove os bairros digitados pelos anunciantes.</p><Link className="button button--secondary" href="/admin/anuncios">Voltar para moderação</Link></div>
    {params.concluido ? <p className="admin-alert admin-alert--success">{successMessage(params)}</p> : null}
    {params.erro ? <p className="admin-alert admin-alert--error">{params.erro === "selecao" ? "Marque pelo menos um bairro da lista para adicionar." : "Não foi possível salvar o bairro. Confira o nome e tente novamente."}</p> : null}

    <nav className="neighborhood-city-tabs" aria-label="Escolher cidade">{cities.map(city => <Link className={city.id === selectedCity?.id ? "is-active" : ""} href={`/admin/bairros?cidade=${city.slug}`} key={city.id}>{city.name}</Link>)}</nav>

    {selectedCity ? <section className="neighborhood-manager">
      <div className="neighborhood-manager__summary"><div><span className="section-kicker">{selectedCity.name}</span><h2>{neighborhoods.length} {neighborhoods.length === 1 ? "bairro cadastrado" : "bairros cadastrados"}</h2></div><span>{neighborhoods.filter(item => item.needsReview).length} aguardando revisão</span></div>
      <form action={createNeighborhood} className="neighborhood-manager__create"><input type="hidden" name="cityId" value={selectedCity.id}/><label><span>Adicionar bairro</span><input name="name" minLength={2} maxLength={80} placeholder="Ex: Centro" required/></label><PendingSubmitButton className="button button--primary" pendingText="Adicionando…">Adicionar</PendingSubmitButton></form>
      {result === null ? (
        <form className="neighborhood-import__start" action="/admin/bairros">
          <input type="hidden" name="cidade" value={selectedCity.slug}/><input type="hidden" name="importar" value="1"/>
          <p>Busque os bairros de {selectedCity.name} na lista da prefeitura e no OpenStreetMap e escolha quais adicionar.</p>
          <PendingSubmitButton className="button button--secondary" pendingText="Buscando bairros…" navigation>Buscar bairros</PendingSubmitButton>
        </form>
      ) : !result.suggestions.length && result.osmUnavailable ? (
        <p className="admin-alert admin-alert--error">Não foi possível consultar o OpenStreetMap agora, e não há lista da prefeitura guardada para {selectedCity.name}. Tente de novo em alguns minutos.</p>
      ) : !newSuggestions.length ? (
        <p className="admin-alert">{result.suggestions.length ? `Todos os ${result.suggestions.length} bairros encontrados para ${selectedCity.name} já estão na lista.` : `Não há lista da prefeitura guardada nem bairros no OpenStreetMap para ${selectedCity.name}. Adicione-os um a um acima.`}</p>
      ) : (
        <form action={importNeighborhoods} className="neighborhood-import">
          <input type="hidden" name="cityId" value={selectedCity.id}/>
          <h3>{newSuggestions.length} {newSuggestions.length === 1 ? "bairro encontrado" : "bairros encontrados"}</h3>
          <p>Confira antes de adicionar. Localidades rurais, loteamentos e vilas vêm desmarcados porque nem sempre devem aparecer como bairro.</p>
          {result.officialSource ? <p>Lista da prefeitura: <a className="text-link" href={result.officialSource.sourceUrl} target="_blank" rel="noopener noreferrer">{result.officialSource.source}</a>. Confiança {result.officialSource.confidence}{result.officialSource.confidence === "baixa" ? ": a lista foi montada com citações soltas e pode estar incompleta" : ""}.</p> : null}
          {result.osmUnavailable ? <p className="admin-alert">O OpenStreetMap não respondeu agora; a lista abaixo traz só os bairros da prefeitura.</p> : null}
          <fieldset>
            <legend className="sr-only">Bairros para adicionar</legend>
            {newSuggestions.map(suggestion => (
              <label key={suggestion.slug}>
                <input type="checkbox" name="name" value={suggestion.name} defaultChecked={suggestion.kind === "official" || suggestion.kind === "neighborhood"}/>
                <span>{suggestion.name}</span>
                <small>{suggestionLabel(suggestion)}</small>
              </label>
            ))}
          </fieldset>
          <div className="neighborhood-import__actions">
            <PendingSubmitButton className="button button--primary" pendingText="Adicionando…">Adicionar bairros marcados</PendingSubmitButton>
            <Link className="text-link" href={`/admin/bairros?cidade=${selectedCity.slug}`}>Cancelar</Link>
          </div>
          {result.suggestions.some(suggestion => suggestion.source === "osm") ? <small className="neighborhood-import__credit">Dados do OpenStreetMap © colaboradores do OpenStreetMap, licença ODbL.</small> : null}
        </form>
      )}
      <div className="neighborhood-manager__list">{neighborhoods.map(neighborhood => <form action={updateNeighborhood} className="neighborhood-manager__item" key={neighborhood.id}><input type="hidden" name="id" value={neighborhood.id}/><label><span>{neighborhood.needsReview ? "Aguardando revisão" : "Bairro aprovado"}</span><input name="name" defaultValue={neighborhood.name} minLength={2} maxLength={80} required/></label><small>{neighborhood._count.properties} {neighborhood._count.properties === 1 ? "imóvel" : "imóveis"}</small><PendingSubmitButton className="button button--secondary" pendingText="Salvando…">Salvar</PendingSubmitButton></form>)}</div>
    </section> : <div className="empty-state"><strong>Nenhuma cidade ativa.</strong></div>}
  </div></main><MobileNav citySlug={selectedCity?.slug}/></>;
}
