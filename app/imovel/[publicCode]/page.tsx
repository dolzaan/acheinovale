import { notFound, permanentRedirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { propertyUrl } from "@/lib/listings/urls";

type Props = { params: Promise<{ publicCode: string }> };

export default async function LegacyPropertyPage({ params }: Props) {
  const { publicCode } = await params;
  const property = await prisma.property.findFirst({
    where: { OR: [{ publicCode }, { slug: publicCode }] },
    select: { publicCode: true, slug: true },
  });
  if (!property) notFound();
  permanentRedirect(propertyUrl(property));
}
