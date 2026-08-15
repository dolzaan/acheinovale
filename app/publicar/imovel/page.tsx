import { Header } from "@/components/header";
import { MobileNav } from "@/components/mobile-nav";
import { PhoneInput } from "@/components/phone-input";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db";
import { createProperty } from "./actions";

type Props = { searchParams: Promise<{ erro?: string }> };

const errorMessages: Record<string, string> = {
  dados: "Confira o título, a descrição, o preço e o WhatsApp informados.",
  local: "O bairro selecionado não pertence à cidade escolhida. Selecione a localização novamente.",
  salvar: "Não foi possível salvar o anúncio agora. Tente novamente em alguns instantes.",
};

export default async function NewPropertyPage({ searchParams }: Props) {
  const user = await requireCurrentUser("/publicar/imovel");
  if (!user.cityId || !user.phone) { const { redirect } = await import("next/navigation"); redirect("/perfil?primeiro=1&next=/publicar/imovel"); }
  const [params, cities] = await Promise.all([searchParams, prisma.city.findMany({ where: { isActive: true }, include: { neighborhoods: { orderBy: { name: "asc" } } }, orderBy: { name: "asc" } })]);
  return <><Header/><main className="account-page"><div className="container form-page"><div className="account-heading"><span className="section-kicker">Novo anúncio</span><h1>Publicar imóvel</h1><p>Informe os dados principais. Fotos e endereço detalhado poderão ser adicionados na edição.</p></div>{params.erro && <p className="form-alert">{errorMessages[params.erro] || "Revise os campos informados."}</p>}<form className="listing-form" action={createProperty}>
    <label className="field-wide"><span>Título</span><input name="title" minLength={8} maxLength={120} placeholder="Ex: Casa com 3 quartos no Centro" required/></label>
    <label><span>Finalidade</span><select name="purpose" required><option value="RENT">Aluguel</option><option value="SALE">Venda</option></select></label>
    <label><span>Tipo</span><select name="type" required><option value="HOUSE">Casa</option><option value="APARTMENT">Apartamento</option><option value="STUDIO">Kitnet / Studio</option><option value="LAND">Terreno</option><option value="COMMERCIAL_ROOM">Sala comercial</option><option value="WAREHOUSE">Galpão</option><option value="OTHER">Outro</option></select></label>
    <label><span>Cidade</span><select name="cityId" defaultValue={user.cityId || ""} required>{cities.map(c => <option key={c.id} value={c.id}>{c.name} — {c.stateCode}</option>)}</select></label>
    <label><span>Bairro</span><select name="neighborhoodId" required><option value="">Selecione</option>{cities.flatMap(c => c.neighborhoods.map(n => <option key={n.id} value={n.id}>{n.name} — {c.name}</option>))}</select></label>
    <label><span>Preço (R$)</span><input name="price" inputMode="decimal" placeholder="1.500,00" required/></label>
    <label><span>WhatsApp do anúncio</span><PhoneInput name="whatsapp" defaultValue={user.phone || ""}/></label>
    <label><span>Quartos</span><input name="bedrooms" type="number" min="0" max="30"/></label><label><span>Banheiros</span><input name="bathrooms" type="number" min="0" max="30"/></label><label><span>Vagas</span><input name="parkingSpots" type="number" min="0" max="30"/></label>
    <label className="field-wide"><span>Descrição</span><textarea name="description" minLength={30} maxLength={3000} rows={7} placeholder="Conte os principais detalhes do imóvel..." required/></label>
    <button className="button button--primary field-wide" type="submit">Enviar para análise</button>
  </form></div></main><MobileNav/></>;
}
