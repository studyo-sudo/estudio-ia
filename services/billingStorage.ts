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
  creditGrants: CreditGrant[];
};

export type CreditGrant = {
  id: string;
  amount: number;
  remaining: number;
  purchasedAt: number;
  expiresAt: number;
};

const DEFAULT_BILLING_STATE: BillingState = {
  plan: 'free',
  credits: 0,
  creditGrants: [],
};

const CREDIT_EXPIRATION_MS = 30 * 24 * 60 * 60 * 1000;

async function hasAuthenticatedSession() {
  const auth = await getAuthState();
  return Boolean(auth.token);
}

function normalizeBillingState(parsed: Partial<BillingState> | null | undefined): BillingState {
  const now = Date.now();
  const grants = Array.isArray(parsed?.creditGrants)
    ? parsed.creditGrants
        .filter(
          (grant): grant is CreditGrant =>
            Boolean(
              grant &&
                typeof grant.id === 'string' &&
                typeof grant.amount === 'number' &&
                typeof grant.remaining === 'number' &&
                typeof grant.purchasedAt === 'number' &&
                typeof grant.expiresAt === 'number'
            )
        )
        .filter((grant) => grant.remaining > 0 && grant.expiresAt > now)
        .sort((a, b) => a.expiresAt - b.expiresAt)
    : [];

  if (grants.length === 0 && typeof parsed?.credits === 'number' && parsed.credits > 0) {
    grants.push({
      id: `legacy-${now}`,
      amount: parsed.credits,
      remaining: parsed.credits,
      purchasedAt: now,
      expiresAt: now + CREDIT_EXPIRATION_MS,
    });
  }

  const credits = grants.reduce((total, grant) => total + grant.remaining, 0);

  return {
    plan: parsed?.plan === 'premium' ? 'premium' : 'free',
    credits,
    creditGrants: grants,
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
  const validAmount = Number.isFinite(amount) && amount > 0 ? Math.floor(amount) : 0;

  if (validAmount <= 0) {
    return;
  }

  if (await hasAuthenticatedSession()) {
    try {
      const remoteState = normalizeBillingState(await addRemoteCredits(validAmount));
      await AsyncStorage.setItem(BILLING_KEY, JSON.stringify(remoteState));
      return;
    } catch {
      // Falls back to local persistence when backend is unavailable.
    }
  }

  const current = await getBillingState();
  const now = Date.now();
  await setBillingState({
    ...current,
    creditGrants: [
      ...current.creditGrants,
      {
        id: `local-${now}`,
        amount: validAmount,
        remaining: validAmount,
        purchasedAt: now,
        expiresAt: now + CREDIT_EXPIRATION_MS,
      },
    ],
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

  let remainingToConsume = amount;
  const nextGrants = current.creditGrants.map((grant) => {
    if (remainingToConsume <= 0) {
      return grant;
    }

    const spend = Math.min(grant.remaining, remainingToConsume);
    remainingToConsume -= spend;

    return {
      ...grant,
      remaining: grant.remaining - spend,
    };
  });

  await setBillingState({
    ...current,
    creditGrants: nextGrants,
  });

  return true;
}
