import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { Logo } from "@/components/logo";
import { signInWithGoogle } from "@/app/auth/actions";
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

          <form action={signInWithGoogle}>
            <input type="hidden" name="next" value={destination} />
            <button className="google-button" type="submit">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4a4.6 4.6 0 0 1-2 3v2.5h3.3c1.9-1.8 2.9-4.4 2.9-7.4Z"/><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.4l-3.3-2.5c-.9.6-2.1 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3v2.6A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.4 14a6 6 0 0 1 0-4V7.4H3a10 10 0 0 0 0 9.2L6.4 14Z"/><path fill="#EA4335" d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.9-2.8A9.7 9.7 0 0 0 3 7.4L6.4 10c.8-2.3 3-4.1 5.6-4.1Z"/></svg>
              Continuar com Google
            </button>
          </form>

          <small>Ao continuar, você concorda com os termos e a política de privacidade da plataforma.</small>
        </section>
      </main>
    </>
  );
}
