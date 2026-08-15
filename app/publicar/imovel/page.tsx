import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { MobileNav } from "@/components/mobile-nav";
import { PropertyPublishForm } from "@/components/property-publish-form";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db";

type Props = { searchParams: Promise<{ erro?: string }> };

const errorMessages: Record<string, string> = {
  dados: "Confira o título, a descrição, o preço e o WhatsApp informados.",
  local: "O bairro selecionado não pertence à cidade escolhida. Selecione a localização novamente.",
  fotos: "Não foi possível validar as fotos. Selecione-as novamente e tente publicar.",
  salvar: "Não foi possível salvar o anúncio agora. Tente novamente em alguns instantes.",
};

export default async function NewPropertyPage({ searchParams }: Props) {
  const user = await requireCurrentUser("/publicar/imovel");
  if (!user.authUserId) redirect("/entrar?next=%2Fpublicar%2Fimovel");
  if (!user.cityId || !user.phone) redirect("/perfil?primeiro=1&next=/publicar/imovel");

  const [params, cities] = await Promise.all([
    searchParams,
    prisma.city.findMany({ where: { isActive: true }, include: { neighborhoods: { orderBy: { name: "asc" } } }, orderBy: { name: "asc" } }),
  ]);

  return (
    <>
      <Header />
      <main className="account-page">
        <div className="container form-page">
          <div className="account-heading"><span className="section-kicker">Novo anúncio</span><h1>Publicar imóvel</h1><p>Preencha os dados e adicione até 10 fotos para apresentar melhor o imóvel.</p></div>
          {params.erro ? <p className="form-alert">{errorMessages[params.erro] || "Revise os campos informados."}</p> : null}
          <PropertyPublishForm
            authUserId={user.authUserId}
            cityId={user.cityId}
            phone={user.phone}
            cities={cities.map(city => ({ id: city.id, name: city.name, stateCode: city.stateCode, neighborhoods: city.neighborhoods.map(neighborhood => ({ id: neighborhood.id, name: neighborhood.name })) }))}
          />
        </div>
      </main>
      <MobileNav />
    </>
  );
}
