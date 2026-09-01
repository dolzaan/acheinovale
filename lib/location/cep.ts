import "server-only";

export type ViaCepAddress = {
  cep: string;
  street: string;
  complement: string;
  neighborhood: string;
  city: string;
  stateCode: string;
  ibgeCode: string;
};

type ViaCepResponse = {
  cep?: string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  ibge?: string;
  erro?: boolean | "true";
};

export function normalizeCep(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length === 8 ? digits : null;
}

export async function getAddressByCep(value: string): Promise<ViaCepAddress | null> {
  const cep = normalizeCep(value);
  if (!cep) return null;

  const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 60 * 60 * 24 * 7 },
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) return null;
  const data = await response.json() as ViaCepResponse;
  if (data.erro || !data.localidade || !data.uf || !data.ibge) return null;

  return {
    cep,
    street: data.logradouro?.trim() ?? "",
    complement: data.complemento?.trim() ?? "",
    neighborhood: data.bairro?.trim() ?? "",
    city: data.localidade.trim(),
    stateCode: data.uf.trim().toUpperCase(),
    ibgeCode: data.ibge.trim(),
  };
}
