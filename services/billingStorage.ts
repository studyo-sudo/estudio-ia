import AsyncStorage from '@react-native-async-storage/async-storage';

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

export async function getBillingState(): Promise<BillingState> {
  try {
    const raw = await AsyncStorage.getItem(BILLING_KEY);

    if (!raw) {
      return DEFAULT_BILLING_STATE;
    }

    const parsed = JSON.parse(raw);

    return {
      plan: parsed?.plan === 'premium' ? 'premium' : 'free',
      credits:
        typeof parsed?.credits === 'number' && parsed.credits >= 0
          ? parsed.credits
          : 0,
    };
  } catch {
    return DEFAULT_BILLING_STATE;
  }
}

export async function setBillingState(state: BillingState): Promise<void> {
  await AsyncStorage.setItem(BILLING_KEY, JSON.stringify(state));
}

export async function setPlan(plan: PlanType): Promise<void> {
  const current = await getBillingState();
  await setBillingState({
    ...current,
    plan,
  });
}

export async function addCredits(amount: number): Promise<void> {
  const current = await getBillingState();
  await setBillingState({
    ...current,
    credits: current.credits + amount,
  });
}

export async function consumeCredits(amount: number): Promise<boolean> {
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