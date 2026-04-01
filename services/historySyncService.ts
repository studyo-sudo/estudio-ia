import { requestJson, requestText } from './apiClient';
import { getAuthState } from './authStorage';
import { getHistoryItems, HistoryItem } from './historyStorage';

function buildAuthHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export async function pushHistoryToCloud(): Promise<number> {
  const auth = await getAuthState();
  if (!auth.token) throw new Error('No hay sesion iniciada para sincronizar.');

  const items = await getHistoryItems();

  await requestText({
    path: '/history/sync/push',
    method: 'POST',
    headers: buildAuthHeaders(auth.token),
    body: JSON.stringify({ items }),
  });

  return items.length;
}

export async function pullHistoryFromCloud(): Promise<HistoryItem[]> {
  const auth = await getAuthState();
  if (!auth.token) throw new Error('No hay sesion iniciada para sincronizar.');

  const data = await requestJson<{ items?: HistoryItem[] }>({
    path: '/history/sync/pull',
    method: 'GET',
    headers: buildAuthHeaders(auth.token),
  });
  return Array.isArray(data?.items) ? data.items : [];
}
