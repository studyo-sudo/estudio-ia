import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuthState } from './authStorage';
import {
  addRemoteCredits,
  consumeRemoteCredits,
  fetchRemoteBillingState,
  updateRemoteBillingState,
} from './billingApi';

const BILLING_KEY = 'billing_state_v1';

export type PlanType = 'free' | 'premium';

export type BillingState = {
  plan: PlanType;
  credits: number;
};

const DEFAULT_BILLING_STATE: BillingState = {
  plan: 'free',
  credits: 0,
};

async function hasAuthenticatedSession() {
  const auth = await getAuthState();
  return Boolean(auth.token);
}

function normalizeBillingState(parsed: Partial<BillingState> | null | undefined): BillingState {
  return {
    plan: parsed?.plan === 'premium' ? 'premium' : 'free',
    credits:
      typeof parsed?.credits === 'number' && parsed.credits >= 0
        ? parsed.credits
        : 0,
  };
}

async function getLocalBillingState(): Promise<BillingState> {
  try {
    const raw = await AsyncStorage.getItem(BILLING_KEY);

    if (!raw) {
      return DEFAULT_BILLING_STATE;
    }

    return normalizeBillingState(JSON.parse(raw));
  } catch {
    return DEFAULT_BILLING_STATE;
  }
}

export async function getBillingState(): Promise<BillingState> {
  if (await hasAuthenticatedSession()) {
    try {
      const remoteState = normalizeBillingState(await fetchRemoteBillingState());
      await AsyncStorage.setItem(BILLING_KEY, JSON.stringify(remoteState));
      return remoteState;
    } catch {
      return getLocalBillingState();
    }
  }

  return getLocalBillingState();
}

export async function setBillingState(state: BillingState): Promise<void> {
  const normalized = normalizeBillingState(state);

  if (await hasAuthenticatedSession()) {
    try {
      const remoteState = normalizeBillingState(await updateRemoteBillingState(normalized));
      await AsyncStorage.setItem(BILLING_KEY, JSON.stringify(remoteState));
      return;
    } catch {
      // Falls back to local persistence when backend is unavailable.
    }
  }

  await AsyncStorage.setItem(BILLING_KEY, JSON.stringify(normalized));
}

export async function setPlan(plan: PlanType): Promise<void> {
  const current = await getBillingState();
  await setBillingState({
    ...current,
    plan,
  });
}

export async function addCredits(amount: number): Promise<void> {
  if (await hasAuthenticatedSession()) {
    try {
      const remoteState = normalizeBillingState(await addRemoteCredits(amount));
      await AsyncStorage.setItem(BILLING_KEY, JSON.stringify(remoteState));
      return;
    } catch {
      // Falls back to local persistence when backend is unavailable.
    }
  }

  const current = await getBillingState();
  await setBillingState({
    ...current,
    credits: current.credits + amount,
  });
}

export async function consumeCredits(amount: number): Promise<boolean> {
  if (await hasAuthenticatedSession()) {
    try {
      const response = await consumeRemoteCredits(amount);
      await AsyncStorage.setItem(
        BILLING_KEY,
        JSON.stringify(normalizeBillingState(response.billing))
      );
      return response.success;
    } catch {
      // Falls back to local persistence when backend is unavailable.
    }
  }

  const current = await getBillingState();

  if (current.credits < amount) {
    return false;
  }

  await setBillingState({
    ...current,
    credits: current.credits - amount,
  });

  return true;
}
