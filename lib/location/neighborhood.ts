const lowerCaseConnectors = new Set(["a", "as", "da", "das", "de", "do", "dos", "e"]);

export function normalizeNeighborhoodName(value: string) {
  const compact = value.trim().replace(/\s+/g, " ");
  if (!compact) return "";

  return compact
    .split(" ")
    .map((word, index) => {
      const lower = word.toLocaleLowerCase("pt-BR");
      if (index > 0 && lowerCaseConnectors.has(lower)) return lower;
      return lower.charAt(0).toLocaleUpperCase("pt-BR") + lower.slice(1);
    })
    .join(" ");
}
