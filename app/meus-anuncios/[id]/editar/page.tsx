import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { MobileNav } from "@/components/mobile-nav";
import { PropertyEditForm } from "@/components/property-edit-form";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erro?: string; salvo?: string; revisao?: string }>;
};

const errorMessages: Record<string, string> = {
  dados: "Confira o título, a descrição, o preço e o WhatsApp informados.",
  local: "Informe um bairro válido para a cidade escolhida.",
  cep: "Não foi possível confirmar o CEP e a cidade. Consulte o CEP novamente ou deixe-o em branco.",
  limite: "Muitas alterações em pouco tempo. Aguarde alguns minutos.",
  permissao: "Este anúncio não pode ser alterado.",
};

type PrivateAddress = { cep?: string | null; logradouro?: string | null; numero?: string | null; complemento?: string | null };

export default async function EditPropertyPage({ params, searchParams }: Props) {
  const { id } = await params;
  const query = await searchParams;
  const user = await requireCurrentUser(`/meus-anuncios/${id}/editar`);
  const property = await prisma.property.findFirst({
    where: { id, ownerId: user.id, status: { not: "ARCHIVED" } },
    include: { neighborhood: { select: { id: true, name: true } } },
  });
  if (!property) notFound();

  const cities = await prisma.city.findMany({
    where: { isActive: true },
    include: { neighborhoods: { where: { needsReview: false }, orderBy: { name: "asc" }, select: { id: true, name: true } } },
    orderBy: { name: "asc" },
  });
  const address = (property.privateAddressData ?? {}) as PrivateAddress;

  return (
    <>
      <Header />
      <main className="account-page">
        <div className="container form-page">
          <Link className="back-link" href="/meus-anuncios">← Voltar para meus anúncios</Link>
          <div className="account-heading"><span className="section-kicker">Editar anúncio · Código {property.publicCode.toUpperCase()}</span><h1>Dados do imóvel</h1><p>Para alterar fotos e vídeo, use <Link href={`/meus-anuncios/${property.id}/midias`}>Editar mídias</Link>.</p></div>
          {query.salvo ? <div className="form-success" role="status"><strong>Alterações salvas.</strong>{query.revisao ? <p>O anúncio voltou para análise e aparecerá novamente após a aprovação.</p> : <p>Nenhuma informação pública mudou, então o anúncio continua como estava.</p>}</div> : null}
          {query.erro ? <p className="form-alert" role="alert">{errorMessages[query.erro] || "Revise os campos informados."}</p> : null}
          <PropertyEditForm
            propertyId={property.id}
            cities={cities.map(city => ({ id: city.id, name: city.name, stateCode: city.stateCode, neighborhoods: city.neighborhoods }))}
            initial={{
              title: property.title,
              description: property.description,
              purpose: property.purpose,
              type: property.type,
              priceCents: property.priceCents,
              whatsapp: property.whatsapp,
              bedrooms: property.bedrooms,
              bathrooms: property.bathrooms,
              parkingSpots: property.parkingSpots,
              cityId: property.cityId,
              neighborhood: property.neighborhood,
              cep: address.cep ?? "",
              street: address.logradouro ?? "",
              addressNumber: address.numero ?? "",
              addressComplement: address.complemento ?? "",
            }}
          />
        </div>
      </main>
      <MobileNav />
    </>
  );
}
