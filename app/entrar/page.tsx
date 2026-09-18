import { redirect } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { Logo } from "@/components/logo";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { getCurrentUser } from "@/lib/auth/current-user";
import { safeInternalPath } from "@/lib/validation/profile";

type LoginPageProps = {
  searchParams: Promise<{ next?: string; erro?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [{ next, erro }, currentUser] = await Promise.all([searchParams, getCurrentUser()]);
  const destination = safeInternalPath(next);

  if (currentUser) redirect(destination);

  return (
    <>
      <Header />
      <main className="auth-page">
        <section className="auth-card">
          <Logo />
          <span className="auth-card__eyebrow">Sua conta local</span>
          <h1>Entrar no AcheiNoVale</h1>
          <p>Entre para anunciar imóveis, divulgar seus serviços e gerenciar seus anúncios no AcheiNoVale.</p>

          {erro && <p className="form-alert" role="alert">Não foi possível entrar. Tente novamente.</p>}

          <GoogleSignInButton next={destination} />

          <small>Ao continuar, você concorda com os <Link href="/termos">Termos de Uso</Link> e a <Link href="/privacidade">Política de Privacidade</Link>.</small>
        </section>
      </main>
    </>
  );
}
