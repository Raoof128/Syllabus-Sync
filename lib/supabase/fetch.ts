/**
 * Supabase fetch wrapper with timeout + better network error context.
 *
 * This prevents long hangs when upstream connections are unstable (e.g. ECONNRESET).
 */

const DEFAULT_SUPABASE_FETCH_TIMEOUT_MS =
  process.env.NODE_ENV === "development" ? 20_000 : 15_000;

function toAbortError(reason: string): Error {
  const error = new Error(reason);
  error.name = "AbortError";
  return error;
}

function combineSignals(
  primary?: AbortSignal | null,
  secondary?: AbortSignal | null,
): AbortSignal | undefined {
  if (!primary) return secondary ?? undefined;
  if (!secondary) return primary ?? undefined;

  const controller = new AbortController();
  const abort = () => controller.abort();

  if (primary.aborted || secondary.aborted) {
    controller.abort();
    return controller.signal;
  }

  primary.addEventListener("abort", abort, { once: true });
  secondary.addEventListener("abort", abort, { once: true });
  return controller.signal;
}

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
  timeoutMs: number = DEFAULT_SUPABASE_FETCH_TIMEOUT_MS,
): Promise<Response> {
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => {
    timeoutController.abort(
      toAbortError(`Supabase request timeout after ${timeoutMs}ms`),
    );
  }, timeoutMs);

  try {
    const mergedSignal = combineSignals(init?.signal, timeoutController.signal);
    return await fetch(input, { ...init, signal: mergedSignal });
  } finally {
    clearTimeout(timeoutId);
  }
}
