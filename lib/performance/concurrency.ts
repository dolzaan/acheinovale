import "server-only";

/**
 * Executa `worker` para cada item com no máximo `limit` execuções simultâneas.
 * Itens ainda não iniciados são ignorados quando `shouldContinue` retorna false,
 * o que permite encerrar um cron antes do limite de duração da função.
 */
export async function forEachWithConcurrency<T>(
  items: readonly T[],
  limit: number,
  worker: (item: T) => Promise<void>,
  shouldContinue: () => boolean = () => true,
) {
  let next = 0;
  async function run() {
    while (next < items.length && shouldContinue()) {
      const item = items[next++];
      await worker(item);
    }
  }
  await Promise.all(Array.from({ length: Math.min(Math.max(1, limit), items.length) }, run));
}
