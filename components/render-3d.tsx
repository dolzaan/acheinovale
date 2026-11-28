import Image from "next/image";

// Objetos 3D da marca em public/renders/<nome>.webp (fundo transparente),
// gerados por IA no estilo de miniatura realista de estúdio e recortados.
// Proporção de cada arquivo, para o navegador reservar o espaço certo.
export const RENDERS_3D = {
  casa: [720, 488],
  caminhao: [720, 603],
  chave: [720, 444],
  caixa: [590, 720],
  lupa: [353, 720],
  pin: [610, 720],
  predio: [572, 720],
  // características do imóvel
  quarto: [400, 255],
  banheiro: [311, 400],
  vaga: [400, 241],
  area: [400, 233],
  enchente: [400, 337],
  terreno: [400, 241],
  seguranca: [323, 400],
} as const;

export type Render3DNome = keyof typeof RENDERS_3D;

type Render3DProps = {
  nome: Render3DNome;
  /** Lado maior exibido, em px (define o tamanho que o otimizador entrega). */
  tamanho: number;
  className?: string;
  prioridade?: boolean;
};

export function Render3D({ nome, tamanho, className, prioridade }: Render3DProps) {
  const [w, h] = RENDERS_3D[nome];
  const escala = tamanho / Math.max(w, h);
  return (
    <Image
      className={["render-3d", className ?? ""].filter(Boolean).join(" ")}
      src={`/renders/${nome}.webp`}
      alt=""
      aria-hidden
      width={Math.round(w * escala)}
      height={Math.round(h * escala)}
      sizes={`${tamanho}px`}
      priority={prioridade}
    />
  );
}
