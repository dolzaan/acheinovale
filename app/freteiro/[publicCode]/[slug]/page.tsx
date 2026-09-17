import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { Header } from "@/components/header";
import { MobileNav } from "@/components/mobile-nav";
import { UserAvatar } from "@/components/user-avatar";
import { PropertyGallery } from "@/components/property-gallery";
import { FreighterTrackedContact } from "@/components/freighter-tracked-contact";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { PinIcon, StarIcon, TruckIcon } from "@/components/icons";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getPublicFreighter } from "@/lib/listings/public";
import { freighterUrl } from "@/lib/listings/urls";
import { freighterImagePublicUrl } from "@/lib/supabase/storage";
import { formatBrazilianPhone } from "@/lib/validation/profile";
import { SITE_URL } from "@/lib/site";
import { reportFreighter } from "../../actions";

type Props = {
  params: Promise<{ publicCode: string; slug: string }>;
  searchParams: Promise<{ denuncia?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { publicCode } = await params;
  const freighter = await getPublicFreighter(publicCode);
  if (!freighter) return { title: "Freteiro não encontrado" };

  const canonical = `${SITE_URL}${freighterUrl(freighter)}`;
  return {
    title: `${freighter.displayName} | AcheiNoVale`,
    description: freighter.description.slice(0, 155),
    alternates: { canonical },
    robots: freighter.status === "ACTIVE" ? undefined : { index: false, follow: false },
    openGraph: {
      title: freighter.displayName,
      description: freighter.description.slice(0, 155),
      url: canonical,
      type: "website",
      images: freighter.images[0]
        ? [{ url: freighterImagePublicUrl(freighter.images[0].storageKey), alt: freighter.images[0].altText || freighter.displayName }]
        : undefined,
    },
  };
}

export default async function FreighterPage({ params, searchParams }: Props) {
  const { publicCode, slug } = await params;
  const query = await searchParams;
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
  const whatsappUrl = `https://wa.me/${freighter.whatsapp}?text=${encodeURIComponent(
    `Olá! Encontrei "${freighter.displayName}" no AcheiNoVale e gostaria de saber mais sobre o serviço.`,
  )}`;
  const services = freighter.services.filter(service => !service.name.startsWith("Veículo: ") && !service.name.startsWith("Atende: "));
  const vehicleTypes = freighter.services.filter(service => service.name.startsWith("Veículo: ")).map(service => service.name.slice(9));
  const serviceCities = freighter.services.filter(service => service.name.startsWith("Atende: ")).map(service => service.name.slice(8));
  const canonical = `${SITE_URL}${freighterUrl(freighter)}`;
  const serviceStructuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: freighter.displayName,
    description: freighter.description,
    serviceType: services.map(service => service.name).join(", ") || "Fretes e mudanças",
    areaServed: [freighter.city.name, ...serviceCities],
    image: freighter.images.map(image => freighterImagePublicUrl(image.storageKey)),
    url: canonical,
    provider: {
      "@type": "LocalBusiness",
      name: freighter.displayName,
      telephone: freighter.whatsapp,
      address: {
        "@type": "PostalAddress",
        addressLocality: freighter.city.name,
        addressRegion: "SC",
        addressCountry: "BR",
      },
    },
  };
  const breadcrumbStructuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: `Freteiros em ${freighter.city.name}`, item: `${SITE_URL}/${freighter.city.slug}/freteiros` },
      { "@type": "ListItem", position: 3, name: freighter.displayName, item: canonical },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceStructuredData) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbStructuredData) }} />
      <Header />
      <main className="listing-detail-page">
        <div className="container listing-detail">
          {freighter.status !== "ACTIVE" ? (
            <div className="preview-notice">
              Prévia do proprietário — este perfil ainda não está visível publicamente.
            </div>
          ) : null}

          {freighter.images.length ? (
            <PropertyGallery
              images={freighter.images.map(image => ({ id: image.id, src: freighterImagePublicUrl(image.storageKey), alt: image.altText || `Foto de ${freighter.displayName}`, position: image.position }))}
              videos={[]}
              title={freighter.displayName}
            />
          ) : (
            <div className="listing-detail__hero listing-detail__hero--freighter">
              <TruckIcon size={65} />
              <span>Fretes, mudanças e entregas no Alto Vale do Itajaí.</span>
            </div>
          )}

          <div className="listing-detail__grid">
            <article className="listing-detail__content">
              <span className="listing-code">Código {freighter.publicCode.toUpperCase()}</span>
              <span className="listing-location"><PinIcon size={17} />{freighter.city.name}</span>
              <h1>{freighter.displayName}</h1>
              <div className="listing-facts">
                {rating ? <span><StarIcon />{rating.toFixed(1)} ({freighter.reviews.length})</span> : <span>Novo no AcheiNoVale</span>}
              </div>
              <div className="service-tags service-tags--detail">
                {services.map((service) => <span key={service.id}>{service.name}</span>)}
                {vehicleTypes.map(vehicle => <span key={vehicle}>{vehicle}</span>)}
              </div>
              {serviceCities.length ? <p className="listing-service-cities"><strong>Atende também:</strong> {serviceCities.join(", ")}</p> : null}
              <section className="listing-description">
                <h2>Sobre o serviço</h2>
                <p>{freighter.description}</p>
              </section>
            </article>

            <aside className="listing-contact-card">
              <small>Informações de preço</small>
              <strong className="listing-contact-card__name">{freighter.priceNote || "Solicite um orçamento"}</strong>
              <FreighterTrackedContact publicCode={freighter.publicCode} whatsappUrl={whatsappUrl} />
              <div className="listing-owner">
                <UserAvatar image={freighter.user.image} name={freighter.displayName} />
                <div><small>Responsável</small><b>{freighter.user.name || freighter.displayName}</b></div>
              </div>
              <p>WhatsApp do serviço: {formatBrazilianPhone(freighter.whatsapp)}</p>
              {query.denuncia === "enviada" ? <p className="listing-report-success" role="status">Obrigado. A denúncia foi enviada para análise.</p> : null}
              {query.denuncia === "limite" ? <p className="listing-report-error" role="alert">Limite diário de denúncias atingido.</p> : null}
              {query.denuncia === "erro" ? <p className="listing-report-error" role="alert">Não foi possível enviar essa denúncia.</p> : null}
              <details className="listing-report">
                <summary>Denunciar este perfil</summary>
                <form action={reportFreighter.bind(null, freighter.id)}>
                  <label><span>Motivo</span><select name="reason" required defaultValue=""><option value="" disabled>Selecione</option><option>Contato incorreto</option><option>Suspeita de fraude</option><option>Serviço inexistente</option><option>Conteúdo inadequado</option><option>Outro</option></select></label>
                  <label><span>Detalhes (opcional)</span><textarea name="details" maxLength={500} rows={3} /></label>
                  <PendingSubmitButton pendingText="Enviando...">Enviar denúncia</PendingSubmitButton>
                </form>
              </details>
            </aside>
          </div>
        </div>
      </main>
      <MobileNav />
    </>
  );
}
