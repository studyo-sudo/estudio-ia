import { getAuthState } from './authStorage';
import { postJson, requestJson } from './apiClient';

export type AuthProfile = {
  email: string;
  plan: 'free' | 'premium';
  phoneVerified: boolean;
  phoneNumber: string | null;
};

export type AuthSession = AuthProfile & {
  token: string;
};

function normalizeAuthProfile(data: Partial<AuthProfile> | null | undefined): AuthProfile {
  return {
    email: typeof data?.email === 'string' ? data.email : '',
    plan: data?.plan === 'premium' ? 'premium' : 'free',
    phoneVerified: data?.phoneVerified === true,
    phoneNumber:
      typeof data?.phoneNumber === 'string' && data.phoneNumber.trim().length > 0
        ? data.phoneNumber.trim()
        : null,
  };
}

async function getAuthHeaders() {
  const auth = await getAuthState();

  if (!auth.token) {
    throw new Error('No hay sesion iniciada.');
  }

  return {
    Authorization: `Bearer ${auth.token}`,
  };
}

export async function loginWithEmail(email: string, password: string): Promise<AuthSession> {
  const data = await postJson<Partial<AuthSession>>('/auth/login', { email, password });

  if (!data?.token || typeof data.token !== 'string') {
    throw new Error('El backend no devolvio un token valido.');
  }

  return {
    token: data.token,
    ...normalizeAuthProfile(data),
  };
}

export async function registerWithEmail(email: string, password: string): Promise<AuthSession> {
  const data = await postJson<Partial<AuthSession>>('/auth/register', { email, password });

  if (!data?.token || typeof data.token !== 'string') {
    throw new Error('El backend no devolvio un token valido al registrar.');
  }

  return {
    token: data.token,
    ...normalizeAuthProfile(data),
  };
}

export async function fetchAuthProfile(): Promise<AuthProfile> {
  const data = await requestJson<Partial<AuthProfile>>({
    path: '/auth/me',
    method: 'GET',
    headers: await getAuthHeaders(),
  });

  return normalizeAuthProfile(data);
}

export async function verifyPhoneOnBackend(phoneNumber: string): Promise<AuthProfile> {
  const data = await postJson<Partial<AuthProfile>>(
    '/auth/phone/verify',
    { phoneNumber },
    await getAuthHeaders()
  );

  return normalizeAuthProfile(data);
}
