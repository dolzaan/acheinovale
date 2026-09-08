import { redirect } from "next/navigation";

type Props = { searchParams: Promise<{ q?: string | string[]; cidade?: string | string[] }> };

export default async function Page({ searchParams }: Props) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim().slice(0, 80) : "";
  const city = typeof params.cidade === "string" ? params.cidade : "";
  const next = new URLSearchParams();
  if (query) next.set("q", query);
  if (city) next.set("cidade", city);
  redirect(next.size ? `/imoveis?${next}` : "/imoveis");
}
