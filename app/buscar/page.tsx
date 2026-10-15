import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

type Props = { searchParams: Promise<{ q?: string | string[]; cidade?: string | string[]; regiao?: string | string[] }> };

export default async function Page({ searchParams }: Props) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim().slice(0, 80) : "";
  const city = typeof params.cidade === "string" ? params.cidade : "";
  const regional = params.regiao === "1";
  const next = new URLSearchParams();
  if (query) next.set("q", query);

  if (regional) {
    next.set("regiao", "1");
    redirect(`/imoveis?${next}`);
  }

  if (city) {
    const validCity = await prisma.city.findFirst({
      where: { slug: city, isActive: true },
      select: { slug: true },
    });
    if (validCity) {
      const destination = `/${encodeURIComponent(validCity.slug)}/imoveis`;
      redirect(next.size ? `${destination}?${next}` : destination);
    }
  }
  redirect(next.size ? `/imoveis?${next}` : "/imoveis");
}
