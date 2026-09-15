import "server-only";

const SLOW_OPERATION_MS = 750;

export async function measureServerOperation<T>(operation: string, callback: () => Promise<T>) {
  const startedAt = Date.now();

  try {
    const result = await callback();
    const durationMs = Date.now() - startedAt;

    if (durationMs >= SLOW_OPERATION_MS) {
      console.warn(JSON.stringify({
        level: "warning",
        message: "slow_server_operation",
        operation,
        durationMs,
      }));
    }

    return result;
  } catch (error) {
    console.error(JSON.stringify({
      level: "error",
      message: "server_operation_failed",
      operation,
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    }));
    throw error;
  }
}
