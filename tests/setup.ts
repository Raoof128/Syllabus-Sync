import '@testing-library/jest-dom/vitest';

const originalEmitWarning = process.emitWarning;
process.emitWarning = ((warning: any, ...args: any[]) => {
  const message = typeof warning === 'string' ? warning : warning?.message;
  if (message?.includes('--localstorage-file')) {
    return;
  }
  return originalEmitWarning(warning, ...args);
}) as typeof process.emitWarning;

if (!globalThis.localStorage || typeof globalThis.localStorage.setItem !== 'function') {
  const storage: Record<string, string> = {};
  globalThis.localStorage = {
    getItem: (key: string) => (key in storage ? storage[key] : null),
    setItem: (key: string, value: string) => {
      storage[key] = value;
    },
    removeItem: (key: string) => {
      delete storage[key];
    },
    clear: () => {
      Object.keys(storage).forEach((key) => delete storage[key]);
    },
    key: (index: number) => Object.keys(storage)[index] ?? null,
    get length() {
      return Object.keys(storage).length;
    },
  };
}

if (!globalThis.fetch) {
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const method = init?.method ?? 'GET';
    const body = init?.body ? JSON.parse(String(init.body)) : null;
    const responseBody = method === 'GET' ? [] : (body ?? {});
    return {
      ok: true,
      status: 200,
      json: async () => responseBody,
    } as Response;
  }) as typeof fetch;
}
