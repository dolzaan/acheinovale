const BRAZIL_COUNTRY_CODE = "55";
const INTERNAL_ORIGIN = "https://acheinovale.internal";

export function normalizeBrazilianPhone(value: string) {
  let digits = value.replace(/\D/g, "");

  if (digits.startsWith(BRAZIL_COUNTRY_CODE) && digits.length > 11) {
    digits = digits.slice(2);
  }

  if (digits.length !== 10 && digits.length !== 11) {
    return null;
  }

  return `${BRAZIL_COUNTRY_CODE}${digits}`;
}

export function formatBrazilianPhone(value: string | null | undefined) {
  if (!value) return "";
  const digits = value.replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "");

  if (digits.length === 11) {
    return digits.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
  }

  if (digits.length === 10) {
    return digits.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
  }

  return value;
}

export function safeInternalPath(value: string | null | undefined, fallback = "/perfil") {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  if (/[\\\u0000-\u001f\u007f]/.test(value) || /%5c/i.test(value)) return fallback;

  try {
    const parsed = new URL(value, INTERNAL_ORIGIN);
    if (parsed.origin !== INTERNAL_ORIGIN) return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
