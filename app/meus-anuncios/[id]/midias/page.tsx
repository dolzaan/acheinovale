import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Header } from "@/components/header";
import { MobileNav } from "@/components/mobile-nav";
import { PropertyMediaEditor } from "@/components/property-media-editor";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db";
import { propertyMediaPublicUrl } from "@/lib/supabase/storage";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erro?: string; salvo?: string; revisao?: string }>;
};

const errorMessages: Record<string, string> = {
  dados: "Não foi possível validar as mídias. Tente enviá-las novamente.",
  limite: "Revise a quantidade e a ordem das mídias.",
  permissao: "Este anúncio não pode ser alterado.",
  salvar: "Não foi possível salvar as alterações. Tente novamente.",
};

export default async function PropertyMediaPage({ params, searchParams }: Props) {
  const { id } = await params;
  const query = await searchParams;
  const user = await requireCurrentUser(`/meus-anuncios/${id}/midias`);
  if (!user.authUserId) redirect(`/entrar?next=${encodeURIComponent(`/meus-anuncios/${id}/midias`)}`);
  const property = await prisma.property.findFirst({
    where: { id, ownerId: user.id, status: { not: "ARCHIVED" } },
    include: { images: true, videos: true },
  });
  if (!property) notFound();

  const initialItems = [
    ...property.images.map(image => ({ id: image.id, kind: "image" as const, preview: propertyMediaPublicUrl(image.storageKey), label: image.altText || "Foto do imóvel", existing: true, position: image.position })),
    ...property.videos.map(video => ({ id: video.id, kind: "video" as const, preview: propertyMediaPublicUrl(video.storageKey), label: "Vídeo do imóvel", existing: true, position: video.position })),
  ].sort((a, b) => a.position - b.position);

  return (
    <>
      <Header />
      <main className="account-page">
        <div className="container publish-page">
          <Link className="back-link" href="/meus-anuncios">← Voltar para meus anúncios</Link>
          <div className="account-heading">
            <span className="section-kicker">Galeria do anúncio</span>
            <h1>Fotos e vídeo</h1>
            <p>{property.title}</p>
          </div>
          {query.salvo ? <div className="form-success" role="status"><strong>Mídias salvas.</strong>{query.revisao ? <p>Como o conteúdo do anúncio mudou, ele voltou para análise antes de ser publicado novamente.</p> : <p>A nova ordem já está aplicada ao anúncio.</p>}</div> : null}
          {query.erro ? <p className="form-alert" role="alert">{errorMessages[query.erro] || "Não foi possível concluir a alteração."}</p> : null}
          <div className="form-page">
            <PropertyMediaEditor propertyId={property.id} authUserId={user.authUserId} initialItems={initialItems} />
          </div>
        </div>
      </main>
      <MobileNav />
    </>
  );
}
