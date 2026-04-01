import { getAuthState } from './authStorage';
import { postJson, requestJson } from './apiClient';

export type RemoteBillingState = {
  plan: 'free' | 'premium';
  credits: number;
};

async function getAuthHeaders() {
  const auth = await getAuthState();

  if (!auth.token) {
    throw new Error('No hay sesion iniciada para billing remoto.');
  }

  return {
    Authorization: `Bearer ${auth.token}`,
  };
}

export async function fetchRemoteBillingState() {
  return requestJson<RemoteBillingState>({
    path: '/billing/state',
    method: 'GET',
    headers: await getAuthHeaders(),
  });
}

export async function updateRemoteBillingState(payload: Partial<RemoteBillingState>) {
  return postJson<RemoteBillingState>('/billing/state', payload, await getAuthHeaders());
}

export async function addRemoteCredits(amount: number) {
  return postJson<RemoteBillingState>(
    '/billing/credits/add',
    { amount },
    await getAuthHeaders()
  );
}

export async function consumeRemoteCredits(amount: number) {
  return postJson<{ success: boolean; billing: RemoteBillingState }>(
    '/billing/credits/consume',
    { amount },
    await getAuthHeaders()
  );
}
