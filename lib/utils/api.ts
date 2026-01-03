export interface ApiErrorResponse {
  error: string;
}

export async function apiRequest<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const data = (await response.json().catch(() => null)) as T | ApiErrorResponse | null;

  if (!response.ok) {
    const message =
      (data as ApiErrorResponse | null)?.error ?? `Request failed with ${response.status}`;
    throw new Error(message);
  }

  return data as T;
}
