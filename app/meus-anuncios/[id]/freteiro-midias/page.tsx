import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FreighterMediaEditor } from "@/components/freighter-media-editor";
import { Header } from "@/components/header";
import { MobileNav } from "@/components/mobile-nav";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db";
import { freighterImagePublicUrl } from "@/lib/supabase/storage";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ cadastro?: string; erro?: string; salvo?: string; revisao?: string }>;
};

const errorMessages: Record<string, string> = {
  dados: "Não foi possível validar as fotos. Tente enviá-las novamente.",
  permissao: "Este cadastro não pode ser alterado.",
  salvar: "Não foi possível salvar as alterações. Tente novamente.",
};

export default async function FreighterMediaPage({ params, searchParams }: Props) {
  const { id } = await params;
  const query = await searchParams;
  const path = `/meus-anuncios/${id}/freteiro-midias`;
  const user = await requireCurrentUser(path);
  if (!user.authUserId) redirect(`/entrar?next=${encodeURIComponent(path)}`);
  const profile = await prisma.freighterProfile.findFirst({
    where: { id, userId: user.id, status: { not: "ARCHIVED" } },
    include: { images: { orderBy: { position: "asc" } } },
  });
  if (!profile) notFound();

  const initialItems = profile.images.map(image => ({
    id: image.id,
    kind: "image" as const,
    preview: freighterImagePublicUrl(image.storageKey),
    label: image.altText || "Foto do serviço",
    existing: true,
  }));

  return (
    <>
      <Header />
      <main className="account-page">
        <div className="container publish-page">
          <Link className="back-link" href="/meus-anuncios">← Voltar para meus anúncios</Link>
          <div className="account-heading"><span className="section-kicker">Galeria do freteiro</span><h1>Fotos do serviço</h1><p>{profile.displayName}</p></div>
          {query.cadastro ? <div className="form-success" role="status"><strong>Cadastro salvo.</strong><p>Agora você pode adicionar fotos do veículo e dos serviços realizados.</p></div> : null}
          {query.salvo ? <div className="form-success" role="status"><strong>Fotos salvas.</strong>{query.revisao ? <p>Como o conteúdo público mudou, o cadastro voltou para análise.</p> : <p>A nova ordem já foi aplicada.</p>}</div> : null}
          {query.erro ? <p className="form-alert" role="alert">{errorMessages[query.erro] || "Não foi possível concluir a alteração."}</p> : null}
          <div className="form-page"><FreighterMediaEditor profileId={profile.id} authUserId={user.authUserId} initialItems={initialItems} /></div>
        </div>
      </main>
      <MobileNav />
    </>
  );
}
