import { postJson } from './apiClient';

export async function loginWithEmail(email: string, password: string) {
  const data = await postJson<{ token?: string }>('/auth/login', { email, password });

  if (!data?.token || typeof data.token !== 'string') {
    throw new Error('El backend no devolvio un token valido.');
  }

  return data.token;
}

export async function registerWithEmail(email: string, password: string) {
  const data = await postJson<{ token?: string }>('/auth/register', { email, password });

  if (!data?.token || typeof data.token !== 'string') {
    throw new Error('El backend no devolvio un token valido al registrar.');
  }

  return data.token;
}
