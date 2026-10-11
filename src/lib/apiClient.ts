import { auth } from './firebase';
export async function api<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;
  const response = await fetch(path, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
      ...options.headers,
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Não foi possível concluir a operação');
  return data as T;
}
export const post = <T = any>(path: string, body: unknown, headers: Record<string, string> = {}) =>
  api<T>(path, { method: 'POST', body: JSON.stringify(body), headers });
