// Arquivos de anúncio ficam em "<authUserId>/properties/..." ou "<authUserId>/freighters/...".
// As chaves chegam do navegador e são públicas (aparecem na URL da foto); por isso, antes
// de apagar com a chave de administrador, só sobram as que estão na pasta de quem pediu.
export function ownStorageKeys(keys: readonly unknown[], authUserId: string): string[] {
  if (!authUserId) return [];
  const prefix = `${authUserId}/`;
  return keys.filter((key): key is string =>
    typeof key === "string"
    && key.startsWith(prefix)
    && key.length > prefix.length
    && !key.split("/").some(part => part === ".." || part === "."),
  );
}
