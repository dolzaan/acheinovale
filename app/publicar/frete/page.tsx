import { Header } from "@/components/header";
import { MobileNav } from "@/components/mobile-nav";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { PhoneInput } from "@/components/phone-input";
import { ProfilePhotoInput } from "@/components/profile-photo-input";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db";
import { saveFreighterProfile } from "./actions";

type Props = { searchParams: Promise<{ erro?: string }> };

const vehicleTypes = ["Utilitário", "Van", "Caminhão baú", "Caminhão carroceria", "Moto"];

export default async function NewFreightPage({ searchParams }: Props) {
  const user = await requireCurrentUser("/publicar/frete");
  if (!user.cityId || !user.phone) {
    const { redirect } = await import("next/navigation");
    redirect("/perfil?primeiro=1&next=/publicar/frete");
  }

  const [params, cities, profile] = await Promise.all([
    searchParams,
    prisma.city.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.freighterProfile.findUnique({ where: { userId: user.id }, include: { services: true } }),
  ]);
  const savedVehicleTypes = profile?.services.filter(service => service.name.startsWith("Veículo: ")).map(service => service.name.slice(9)) ?? [];
  const savedCitySlugs = new Set(profile?.services.filter(service => service.slug.startsWith("atende-")).map(service => service.slug.slice(7)) ?? []);
  const savedServiceCityIds = cities.filter(city => savedCitySlugs.has(city.slug)).map(city => city.id);
  const savedServices = profile?.services.filter(service => !service.name.startsWith("Veículo: ") && !service.name.startsWith("Atende: ")) ?? [];

  return <><Header/><main className="account-page"><div className="container form-page">
    <div className="account-heading"><span className="section-kicker">Cadastro profissional</span><h1>{profile ? "Editar cadastro de freteiro" : "Cadastrar como freteiro"}</h1><p>Apresente seu serviço com clareza para receber contatos pelo WhatsApp.</p></div>
    {params.erro && <p className="form-alert">Revise os campos informados ou tente enviar outra foto.</p>}
    <form className="listing-form" action={saveFreighterProfile} encType="multipart/form-data">
      <div className="field-wide"><span className="field-title">Foto profissional</span><ProfilePhotoInput image={user.image} name={profile?.displayName || user.name}/></div>
      <label className="field-wide"><span>Nome profissional</span><input name="displayName" defaultValue={profile?.displayName || user.name || ""} minLength={3} maxLength={100} required/></label>
      <label><span>Cidade base</span><select name="cityId" defaultValue={profile?.cityId || user.cityId || ""} required>{cities.map(city => <option key={city.id} value={city.id}>{city.name}</option>)}</select></label>
      <label><span>WhatsApp</span><PhoneInput name="whatsapp" defaultValue={profile?.whatsapp || user.phone || ""}/></label>
      <label><span>Informação de preço</span><input name="priceNote" maxLength={120} defaultValue={profile?.priceNote || ""} placeholder="Ex: orçamento sem compromisso"/></label>
      <fieldset className="field-wide option-fieldset"><legend>Tipos de veículo</legend><div className="option-grid">{vehicleTypes.map(vehicle => <label className="checkbox-field" key={vehicle}><input type="checkbox" name="vehicleTypes" value={vehicle} defaultChecked={savedVehicleTypes.includes(vehicle)}/><span>{vehicle}</span></label>)}</div></fieldset>
      <fieldset className="field-wide option-fieldset"><legend>Cidades atendidas</legend><div className="option-grid option-grid--cities">{cities.map(city => <label className="checkbox-field" key={city.id}><input type="checkbox" name="serviceCityIds" value={city.id} defaultChecked={savedServiceCityIds.includes(city.id)}/><span>{city.name}</span></label>)}</div><p className="option-fieldset__hint">Marque todas as cidades onde você realiza fretes. Sem seleção, será considerada somente a cidade base.</p></fieldset>
      <label className="field-wide"><span>Serviços, separados por vírgula</span><input name="services" defaultValue={savedServices.map(service => service.name).join(", ") || "Mudanças, Entregas"} required/></label>
      <label className="field-wide"><span>Descrição</span><textarea name="description" minLength={30} maxLength={2000} rows={7} defaultValue={profile?.description || ""} required/></label>
      <PendingSubmitButton className="button button--primary field-wide" pendingText="Salvando cadastro...">Salvar cadastro</PendingSubmitButton>
    </form>
  </div></main><MobileNav/></>;
}
