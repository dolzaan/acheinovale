import type { AnchorHTMLAttributes } from "react";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

/**
 * Link para uma página que abre na cidade salva do visitante (home e catálogos sem cidade).
 * É um <a> comum de propósito: quem escolhe a cidade é o proxy.ts, e ele só redireciona
 * quando a página é aberta de verdade. Com o <Link> do Next, a navigação interna abriria
 * a cidade padrão, e o pré-carregamento de /imoveis atrapalharia o "Toda a região".
 */
export function SavedCityLink({ children, ...props }: Props) {
  // eslint-disable-next-line @next/next/no-html-link-for-pages -- ver o comentário acima.
  return <a {...props}>{children}</a>;
}
