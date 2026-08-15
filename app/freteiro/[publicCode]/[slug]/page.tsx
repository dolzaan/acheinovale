import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { Header } from "@/components/header";
import { MobileNav } from "@/components/mobile-nav";
import { UserAvatar } from "@/components/user-avatar";
import { PinIcon, StarIcon, TruckIcon } from "@/components/icons";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getPublicFreighter } from "@/lib/listings/public";
import { freighterUrl } from "@/lib/listings/urls";
import { formatBrazilianPhone } from "@/lib/validation/profile";

type Props = {
  params: Promise<{ publicCode: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { publicCode } = await params;
  const freighter = await getPublicFreighter(publicCode);
  if (!freighter) return { title: "Freteiro não encontrado" };

  const canonical = `https://acheinovale.vercel.app${freighterUrl(freighter)}`;
  return {
    title: `${freighter.displayName} | AcheiNoVale`,
    description: freighter.description.slice(0, 155),
    alternates: { canonical },
    robots: freighter.status === "ACTIVE" ? undefined : { index: false, follow: false },
  };
}

export default async function FreighterPage({ params }: Props) {
  const { publicCode, slug } = await params;
  const freighter = await getPublicFreighter(publicCode);
  if (!freighter) notFound();

  if (freighter.status !== "ACTIVE") {
    const viewer = await getCurrentUser();
    if (!viewer || (viewer.id !== freighter.userId && viewer.role !== "ADMIN")) {
      notFound();
    }
  }

  if (slug !== freighter.slug) permanentRedirect(freighterUrl(freighter));

  const rating = freighter.reviews.length
    ? freighter.reviews.reduce((sum, review) => sum + review.rating, 0) / freighter.reviews.length
    : null;
  const whatsappUrl = `https://wa.me/${freighter.whatsapp}?text=${encodeURIComponent(`Olá! Encontrei seu perfil ${freighter.publicCode.toUpperCase()} no AcheiNoVale.`)}`;

  return (
    <>
      <Header />
      <main className="listing-detail-page">
        <div className="container listing-detail">
          {freighter.status !== "ACTIVE" ? (
            <div className="preview-notice">
              Prévia do proprietário — este perfil ainda não está visível publicamente.
            </div>
          ) : null}

          <div className="listing-detail__hero listing-detail__hero--freighter">
            <TruckIcon size={65} />
            <span>Fretes, mudanças e entregas no Alto Vale.</span>
          </div>

          <div className="listing-detail__grid">
            <article className="listing-detail__content">
              <span className="listing-code">Código {freighter.publicCode.toUpperCase()}</span>
              <span className="listing-location"><PinIcon size={17} />{freighter.city.name} — {freighter.city.stateCode}</span>
              <h1>{freighter.displayName}</h1>
              <div className="listing-facts">
                {freighter.availableToday ? <span className="availability availability--now">Disponível hoje</span> : null}
                {freighter.serviceRadiusKm ? <span>Atende em um raio de {freighter.serviceRadiusKm} km</span> : null}
                {rating ? <span><StarIcon />{rating.toFixed(1)} ({freighter.reviews.length})</span> : <span>Novo no AcheiNoVale</span>}
              </div>
              <div className="service-tags service-tags--detail">
                {freighter.services.map((service) => <span key={service.id}>{service.name}</span>)}
              </div>
              <section className="listing-description">
                <h2>Sobre o serviço</h2>
                <p>{freighter.description}</p>
              </section>
            </article>

            <aside className="listing-contact-card">
              <small>Informações de preço</small>
              <strong className="listing-contact-card__name">{freighter.priceNote || "Solicite um orçamento"}</strong>
              <a className="button button--primary" href={whatsappUrl} target="_blank" rel="noreferrer">Conversar no WhatsApp</a>
              <div className="listing-owner">
                <UserAvatar image={freighter.user.image} name={freighter.displayName} />
                <div><small>Responsável</small><b>{freighter.user.name || freighter.displayName}</b></div>
              </div>
              <p>WhatsApp do serviço: {formatBrazilianPhone(freighter.whatsapp)}</p>
            </aside>
          </div>
        </div>
      </main>
      <MobileNav />
    </>
  );
}
