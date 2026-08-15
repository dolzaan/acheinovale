import { notFound, permanentRedirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { freighterUrl } from "@/lib/listings/urls";

type Props = { params: Promise<{ publicCode: string }> };

export default async function LegacyFreighterPage({ params }: Props) {
  const { publicCode } = await params;
  const freighter = await prisma.freighterProfile.findFirst({
    where: { OR: [{ publicCode }, { slug: publicCode }] },
    select: { publicCode: true, slug: true },
  });
  if (!freighter) notFound();
  permanentRedirect(freighterUrl(freighter));
}
