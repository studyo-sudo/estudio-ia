import { ApiError } from './apiClient';
import { fetchAuthProfile } from './authApi';
import { getAuthState, logout, updateAuthState } from './authStorage';
import { getBillingState } from './billingStorage';

export async function resolvePostAuthRoute(): Promise<'/login' | '/phone-verification' | '/(tabs)'> {
  const fallbackRoute = '/(tabs)';
  const auth = await getAuthState();

  if (!auth.token) {
    return '/login';
  }

  try {
    const profile = await fetchAuthProfile();

    await updateAuthState({
      email: profile.email || auth.email,
      phoneVerified: profile.phoneVerified,
      phoneNumber: profile.phoneNumber,
    });

    if (profile.plan === 'free' && !profile.phoneVerified) {
      return '/phone-verification';
    }

    return fallbackRoute;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      await logout();
      return '/login';
    }

    try {
      const billing = await getBillingState();
      if (billing.plan === 'free' && !auth.phoneVerified) {
        return '/phone-verification';
      }
    } catch {
      if (!auth.phoneVerified) {
        return '/phone-verification';
      }
    }

    return fallbackRoute;
  }
}
