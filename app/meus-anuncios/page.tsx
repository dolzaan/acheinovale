import Link from "next/link";
import { Header } from "@/components/header";
import { MobileNav } from "@/components/mobile-nav";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db";
import { archiveProperty, pauseFreighter, pauseProperty } from "./actions";

const statusLabel = { DRAFT: "Rascunho", PENDING: "Em análise", ACTIVE: "Ativo", PAUSED: "Pausado", REJECTED: "Rejeitado", ARCHIVED: "Arquivado" } as const;

export default async function MyListingsPage() {
  const user = await requireCurrentUser("/meus-anuncios");
  const [properties, freighter] = await Promise.all([
    prisma.property.findMany({ where: { ownerId: user.id, status: { not: "ARCHIVED" } }, orderBy: { createdAt: "desc" }, include: { city: true } }),
    prisma.freighterProfile.findUnique({ where: { userId: user.id }, include: { city: true } }),
  ]);

  return (
    <><Header /><main className="account-page"><div className="container listings-page">
      <div className="account-heading account-heading--row"><div><span className="section-kicker">Sua área</span><h1>Meus anúncios</h1><p>Gerencie imóveis e serviços publicados com a sua conta.</p></div><Link className="button button--primary" href="/publicar">Novo anúncio</Link></div>
      {!properties.length && !freighter ? <div className="empty-state"><strong>Você ainda não publicou nada.</strong><p>Seu primeiro anúncio leva poucos minutos.</p><Link className="button button--primary" href="/publicar">Publicar grátis</Link></div> : <div className="listing-manager">
        {properties.map((property) => <article className="manager-card" key={property.id}><div><span className={`status-pill status-pill--${property.status.toLowerCase()}`}>{statusLabel[property.status]}</span><h2>{property.title}</h2><p>{property.city.name} · {property.purpose === "RENT" ? "Aluguel" : "Venda"}</p></div><div className="manager-card__actions"><Link href={`/imovel/${property.slug}`}>Visualizar</Link><form action={pauseProperty}><input type="hidden" name="id" value={property.id}/><button>{property.status === "PAUSED" ? "Reativar" : "Pausar"}</button></form><form action={archiveProperty}><input type="hidden" name="id" value={property.id}/><button>Arquivar</button></form></div></article>)}
        {freighter && <article className="manager-card"><div><span className={`status-pill status-pill--${freighter.status.toLowerCase()}`}>{statusLabel[freighter.status]}</span><h2>{freighter.displayName}</h2><p>Freteiro · {freighter.city.name}</p></div><div className="manager-card__actions"><Link href={`/freteiro/${freighter.slug}`}>Visualizar</Link><form action={pauseFreighter}><input type="hidden" name="id" value={freighter.id}/><button>{freighter.status === "PAUSED" ? "Reativar" : "Pausar"}</button></form></div></article>}
      </div>}
    </div></main><MobileNav /></>
  );
}
