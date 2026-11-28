import Image from "next/image";

// Objetos 3D da marca. Cada nome tem um arquivo em public/3d/<nome>.webp.
// Origem atual: Fluent Emoji 3D da Microsoft (licença MIT). Para trocar o estilo,
// basta substituir os arquivos mantendo os nomes.
export const OBJETOS_3D = [
  "casa",
  "casas",
  "apartamento",
  "terreno",
  "chave",
  "caminhao",
  "caixa",
  "pin",
  "lupa",
  "favorito",
  "festa",
] as const;

export type Objeto3DNome = (typeof OBJETOS_3D)[number];

type Objeto3DProps = {
  nome: Objeto3DNome;
  /** Tamanho em px do lado maior. */
  tamanho?: number;
  /** Flutua devagar sozinho (desligado com prefers-reduced-motion). */
  flutuar?: boolean;
  /** Texto alternativo. Vazio (padrão) quando o objeto é só decoração. */
  alt?: string;
  className?: string;
  prioridade?: boolean;
};

export function Objeto3D({ nome, tamanho = 64, flutuar = false, alt = "", className, prioridade }: Objeto3DProps) {
  return (
    <span
      className={["objeto-3d", flutuar ? "objeto-3d--flutuar" : "", className ?? ""].filter(Boolean).join(" ")}
      style={{ "--objeto-3d-tamanho": `${tamanho}px` } as React.CSSProperties}
      aria-hidden={alt ? undefined : true}
    >
      {/* Arquivos já são WebP pequenos (3–11 KB); não precisam passar pelo otimizador. */}
      <Image src={`/3d/${nome}.webp`} alt={alt} width={tamanho} height={tamanho} unoptimized priority={prioridade} />
    </span>
  );
}
