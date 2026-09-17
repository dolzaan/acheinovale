import Link from "next/link";
import { Header } from "@/components/header";
import { HeartIcon } from "@/components/icons";
import { MobileNav } from "@/components/mobile-nav";
import { requireCurrentUser } from "@/lib/auth/current-user";

export default async function FavoritesPage() {
  await requireCurrentUser("/favoritos");

  return (
    <>
      <Header />
      <main className="account-page">
        <div className="container listings-page">
          <div className="account-heading">
            <span className="section-kicker">Sua área</span>
            <h1>Favoritos</h1>
            <p>Em breve você poderá guardar imóveis e freteiros para consultar depois.</p>
          </div>
          <div className="empty-state">
            <HeartIcon size={32} />
            <strong>Favoritos em breve</strong>
            <p>Enquanto preparamos essa função, continue explorando as oportunidades da sua cidade.</p>
            <Link prefetch={false} className="button button--primary" href="/imoveis">Ver imóveis</Link>
          </div>
        </div>
      </main>
      <MobileNav />
    </>
  );
}
