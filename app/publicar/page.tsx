import Link from "next/link";
import { Header } from "@/components/header";
import { MobileNav } from "@/components/mobile-nav";
import { HomeIcon, TruckIcon, ArrowIcon } from "@/components/icons";
import { requireCurrentUser } from "@/lib/auth/current-user";

export default async function PublishPage() {
  const user = await requireCurrentUser("/publicar");

  if (!user.cityId || !user.phone) {
    const { redirect } = await import("next/navigation");
    redirect("/perfil?primeiro=1&next=/publicar");
  }

  return <><Header /><main className="account-page"><div className="container publish-page"><div className="account-heading"><span className="section-kicker">Publicar grátis</span><h1>O que você quer anunciar?</h1><p>Escolha uma opção. O anúncio ficará vinculado à sua conta.</p></div><div className="publish-options"><Link href="/publicar/imovel"><span><HomeIcon size={34}/></span><div><strong>Um imóvel</strong><p>Casa, apartamento, terreno ou espaço comercial para venda ou aluguel.</p></div><ArrowIcon/></Link><Link href="/publicar/frete"><span><TruckIcon size={34}/></span><div><strong>Meu serviço de frete</strong><p>Crie ou atualize seu perfil profissional para receber contatos da região.</p></div><ArrowIcon/></Link></div></div></main><MobileNav /></>;
}
