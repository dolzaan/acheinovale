import Link from "next/link";
import { Header } from "@/components/header";
import { MobileNav } from "@/components/mobile-nav";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { requireAdmin } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db";
import { createNeighborhood, updateNeighborhood } from "./actions";

type Props = { searchParams: Promise<{ cidade?: string; concluido?: string; erro?: string }> };

export default async function NeighborhoodAdminPage({ searchParams }: Props) {
  await requireAdmin("/admin/bairros");
  const params = await searchParams;
  const cities = await prisma.city.findMany({ where: { isActive: true }, select: { id: true, name: true, slug: true }, orderBy: { name: "asc" } });
  const selectedCity = cities.find(city => city.slug === params.cidade) ?? cities.find(city => city.slug === "rio-do-sul") ?? cities[0];
  const neighborhoods = selectedCity ? await prisma.neighborhood.findMany({
    where: { cityId: selectedCity.id },
    include: { _count: { select: { properties: true } } },
    orderBy: [{ needsReview: "desc" }, { name: "asc" }],
  }) : [];

  return <><Header citySlug={selectedCity?.slug}/><main className="account-page admin-page"><div className="container admin-shell">
    <div className="account-heading admin-heading"><span className="section-kicker">Localizações</span><h1>Gerenciar bairros</h1><p>Cadastre bairros oficiais, corrija nomes e aprove os bairros digitados pelos anunciantes.</p><Link className="button button--secondary" href="/admin/anuncios">Voltar para moderação</Link></div>
    {params.concluido ? <p className="admin-alert admin-alert--success">{params.concluido === "criado" ? "Bairro adicionado à lista." : "Bairro atualizado ou mesclado."}</p> : null}
    {params.erro ? <p className="admin-alert admin-alert--error">Não foi possível salvar o bairro. Confira o nome e tente novamente.</p> : null}

    <nav className="neighborhood-city-tabs" aria-label="Escolher cidade">{cities.map(city => <Link className={city.id === selectedCity?.id ? "is-active" : ""} href={`/admin/bairros?cidade=${city.slug}`} key={city.id}>{city.name}</Link>)}</nav>

    {selectedCity ? <section className="neighborhood-manager">
      <div className="neighborhood-manager__summary"><div><span className="section-kicker">{selectedCity.name}</span><h2>{neighborhoods.length} {neighborhoods.length === 1 ? "bairro cadastrado" : "bairros cadastrados"}</h2></div><span>{neighborhoods.filter(item => item.needsReview).length} aguardando revisão</span></div>
      <form action={createNeighborhood} className="neighborhood-manager__create"><input type="hidden" name="cityId" value={selectedCity.id}/><label><span>Adicionar bairro</span><input name="name" minLength={2} maxLength={80} placeholder="Ex: Centro" required/></label><PendingSubmitButton className="button button--primary" pendingText="Adicionando...">Adicionar</PendingSubmitButton></form>
      <div className="neighborhood-manager__list">{neighborhoods.map(neighborhood => <form action={updateNeighborhood} className="neighborhood-manager__item" key={neighborhood.id}><input type="hidden" name="id" value={neighborhood.id}/><label><span>{neighborhood.needsReview ? "Aguardando revisão" : "Bairro aprovado"}</span><input name="name" defaultValue={neighborhood.name} minLength={2} maxLength={80} required/></label><small>{neighborhood._count.properties} {neighborhood._count.properties === 1 ? "imóvel" : "imóveis"}</small><PendingSubmitButton className="button button--secondary" pendingText="Salvando...">Salvar</PendingSubmitButton></form>)}</div>
    </section> : <div className="empty-state"><strong>Nenhuma cidade ativa.</strong></div>}
  </div></main><MobileNav citySlug={selectedCity?.slug}/></>;
}
