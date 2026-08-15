import { redirect } from "next/navigation";
type Props = { searchParams: Promise<{ q?: string }> };
export default async function Page({ searchParams }: Props) { const { q } = await searchParams; const query = q?.trim().slice(0, 80); redirect(query ? `/imoveis?q=${encodeURIComponent(query)}` : "/imoveis"); }
