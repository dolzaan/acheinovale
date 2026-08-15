import { Header } from "@/components/header";
import { MobileNav } from "@/components/mobile-nav";
import { PhoneInput } from "@/components/phone-input";
import { ProfilePhotoInput } from "@/components/profile-photo-input";
import { UserAvatar } from "@/components/user-avatar";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db";
import { safeInternalPath } from "@/lib/validation/profile";
import { updateProfile } from "./actions";

type ProfilePageProps = {
  searchParams: Promise<{ primeiro?: string; salvo?: string; erro?: string; next?: string }>;
};

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const user = await requireCurrentUser("/perfil");
  const [params, cities] = await Promise.all([
    searchParams,
    prisma.city.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);
  const next = safeInternalPath(params.next, "/perfil");
  const errorMessage =
    params.erro === "foto-tipo"
      ? "Escolha uma imagem JPG, PNG, WebP ou AVIF válida."
      : params.erro === "foto-tamanho"
        ? "A foto deve ter no máximo 4 MB."
        : params.erro === "foto-upload"
          ? "Não foi possível salvar a foto. Tente novamente."
          : "Revise os campos informados e tente novamente.";

  return (
    <>
      <Header />
      <main className="account-page">
        <div className="container account-layout">
          <aside className="profile-summary">
            <UserAvatar image={user.image} name={user.name} size="lg" />
            <div><strong>{user.name || "Complete seu perfil"}</strong><span>{user.email}</span></div>
            <small>Membro desde {new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(user.createdAt)}</small>
          </aside>

          <section className="account-card">
            {params.primeiro === "1" && (
              <div className="onboarding-note"><strong>Falta bem pouco!</strong><span>Complete cidade e WhatsApp para continuar.</span></div>
            )}
            <div className="account-heading"><span className="section-kicker">Minha conta</span><h1>Meu perfil</h1><p>Esses dados ajudam a deixar seus anúncios completos e confiáveis.</p></div>
            {params.salvo && <p className="form-success" role="status">Perfil atualizado com sucesso.</p>}
            {params.erro && <p className="form-alert" role="alert">{errorMessage}</p>}

            <form className="profile-form" action={updateProfile}>
              <input type="hidden" name="next" value={next} />
              <div className="profile-photo-field">
                <span>Foto de perfil</span>
                <ProfilePhotoInput image={user.image} name={user.name} />
              </div>
              <label><span>Nome</span><input name="name" defaultValue={user.name || ""} minLength={2} maxLength={100} required /></label>
              <label><span>Email</span><input value={user.email} disabled /><small>O email é gerenciado pela sua conta Google.</small></label>
              <label><span>Cidade</span><select name="cityId" defaultValue={user.cityId || ""} required><option value="" disabled>Selecione sua cidade</option>{cities.map((city) => <option key={city.id} value={city.id}>{city.name} — {city.stateCode}</option>)}</select></label>
              <label><span>WhatsApp</span><PhoneInput defaultValue={user.phone || ""} /><small>Usado como contato somente nos anúncios em que você decidir divulgá-lo.</small></label>
              <button className="button button--primary" type="submit">Salvar perfil</button>
            </form>
          </section>
        </div>
      </main>
      <MobileNav />
    </>
  );
}
