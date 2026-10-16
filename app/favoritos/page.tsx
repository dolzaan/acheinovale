import Image from "next/image";
import Link from "next/link";
import { FavoriteButton } from "@/components/favorite-button";
import { Header } from "@/components/header";
import { HeartIcon, HomeIcon, PinIcon, TruckIcon } from "@/components/icons";
import { MobileNav } from "@/components/mobile-nav";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db";
import { freighterUrl, propertyUrl } from "@/lib/listings/urls";
import { freighterImagePublicUrl, propertyImagePublicUrl } from "@/lib/supabase/storage";

function formatPrice(priceCents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(priceCents / 100);
}

export default async function FavoritesPage() {
  const user = await requireCurrentUser("/favoritos");
  const favorites = await prisma.favorite.findMany({
    where: {
      userId: user.id,
      OR: [{ property: { status: "ACTIVE" } }, { freighterProfile: { status: "ACTIVE" } }],
    },
    orderBy: { createdAt: "desc" },
    include: {
      property: { include: { city: true, neighborhood: true, images: { orderBy: { position: "asc" }, take: 1 } } },
      freighterProfile: { include: { city: true, images: { orderBy: { position: "asc" }, take: 1 } } },
    },
  });

  return (
    <>
      <Header />
      <main className="account-page">
        <div className="container listings-page">
          <div className="account-heading">
            <span className="section-kicker">Sua área</span>
            <h1>Favoritos</h1>
            <p>Imóveis e freteiros que você salvou para consultar depois. Anúncios pausados ou removidos deixam de aparecer aqui.</p>
          </div>
          {!favorites.length ? (
            <div className="empty-state">
              <HeartIcon size={32} />
              <strong>Nenhum favorito ainda</strong>
              <p>Use “Salvar nos favoritos” nos anúncios para encontrá-los rapidamente depois.</p>
              <Link prefetch={false} className="button button--primary" href="/imoveis">Ver imóveis</Link>
            </div>
          ) : (
            <div className="property-grid catalog-grid">
              {favorites.map(favorite => {
                if (favorite.property) {
                  const property = favorite.property;
                  const cover = property.images[0];
                  return (
                    <article className="property-card" key={favorite.id}>
                      <Link prefetch={false} className={cover ? "catalog-property-image" : "catalog-image-placeholder"} href={propertyUrl(property)} aria-label={`Ver ${property.title}`}>
                        {cover ? <Image src={propertyImagePublicUrl(cover.storageKey)} alt={cover.altText || property.title} fill sizes="(max-width: 680px) 100vw, 33vw" /> : <><HomeIcon size={42} /><span>Ver imóvel</span></>}
                      </Link>
                      <div className="property-card__body">
                        <span className="property-card__purpose">{property.purpose === "RENT" ? "Aluguel" : "Venda"}</span>
                        <span className="property-card__location"><PinIcon size={15} />{property.neighborhood.name}, {property.city.name}</span>
                        <h3><Link prefetch={false} href={propertyUrl(property)}>{property.title}</Link></h3>
                        <div className="property-card__price"><strong>{formatPrice(property.priceCents)}</strong><span>{property.purpose === "RENT" ? "/mês" : ""}</span></div>
                        <FavoriteButton kind="imovel" id={property.id} saved />
                      </div>
                    </article>
                  );
                }
                if (favorite.freighterProfile) {
                  const profile = favorite.freighterProfile;
                  const cover = profile.images[0];
                  return (
                    <article className="property-card" key={favorite.id}>
                      <Link prefetch={false} className={cover ? "catalog-property-image" : "catalog-image-placeholder"} href={freighterUrl(profile)} aria-label={`Ver perfil de ${profile.displayName}`}>
                        {cover ? <Image src={freighterImagePublicUrl(cover.storageKey)} alt={cover.altText || profile.displayName} fill sizes="(max-width: 680px) 100vw, 33vw" /> : <><TruckIcon size={42} /><span>Ver perfil</span></>}
                      </Link>
                      <div className="property-card__body">
                        <span className="property-card__purpose">Freteiro</span>
                        <span className="property-card__location"><PinIcon size={15} />{profile.city.name}</span>
                        <h3><Link prefetch={false} href={freighterUrl(profile)}>{profile.displayName}</Link></h3>
                        <FavoriteButton kind="freteiro" id={profile.id} saved />
                      </div>
                    </article>
                  );
                }
                return null;
              })}
            </div>
          )}
        </div>
      </main>
      <MobileNav />
    </>
  );
}
