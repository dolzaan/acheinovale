import Image from "next/image";

// Objetos 3D da marca, renderizados em public/renders/<nome>.webp (fundo transparente).
// Proporção de cada arquivo, para o navegador reservar o espaço certo.
export const RENDERS_3D = {
  casa: [640, 613],
  caminhao: [640, 510],
  chave: [557, 640],
  caixa: [538, 640],
  lupa: [590, 640],
  pin: [498, 640],
  predio: [402, 640],
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
