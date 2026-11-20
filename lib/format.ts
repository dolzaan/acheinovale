const numberFormat = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
const ratingFormat = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** Número no padrão brasileiro: "1.250" e "120,5". Aceita o Decimal do Prisma. */
export function formatNumber(value: number | { toString(): string }) {
  return numberFormat.format(typeof value === "number" ? value : Number(value.toString()));
}

/** Área com espaço não separável antes da unidade, para "m²" não quebrar de linha. */
export function formatArea(value: number | { toString(): string }) {
  return `${formatNumber(value)} m²`;
}

/** Nota média sempre com uma casa: "4,5" e "5,0". */
export function formatRating(value: number) {
  return ratingFormat.format(value);
}

/** Quantidade com o substantivo concordando: "1 quarto", "2 quartos". */
export function formatCount(count: number, singular: string, plural: string) {
  return `${formatNumber(count)} ${count === 1 ? singular : plural}`;
}
