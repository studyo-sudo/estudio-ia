import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_KEY = 'auth_state_v1';

export type AuthState = {
  isAuthenticated: boolean;
  token: string | null;
  email: string | null;
  phoneVerified: boolean;
  phoneNumber: string | null;
};

const DEFAULT_AUTH_STATE: AuthState = {
  isAuthenticated: false,
  token: null,
  email: null,
  phoneVerified: false,
  phoneNumber: null,
};

function normalizeAuthState(state: Partial<AuthState> | null | undefined): AuthState {
  if (!state?.token || typeof state.token !== 'string') {
    return DEFAULT_AUTH_STATE;
  }

  return {
    isAuthenticated: true,
    token: state.token,
    email: typeof state.email === 'string' ? state.email : null,
    phoneVerified: state.phoneVerified === true,
    phoneNumber:
      typeof state.phoneNumber === 'string' && state.phoneNumber.trim().length > 0
        ? state.phoneNumber.trim()
        : null,
  };
}

export async function getAuthState(): Promise<AuthState> {
  try {
    const raw = await AsyncStorage.getItem(AUTH_KEY);
    if (!raw) return DEFAULT_AUTH_STATE;
    const parsed = JSON.parse(raw) as Partial<AuthState>;
    return normalizeAuthState(parsed);
  } catch {
    return DEFAULT_AUTH_STATE;
  }
}

export async function setAuthState(state: AuthState): Promise<void> {
  await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(normalizeAuthState(state)));
}

export async function login(
  token: string,
  email: string,
  options?: { phoneVerified?: boolean; phoneNumber?: string | null }
): Promise<void> {
  await setAuthState({
    isAuthenticated: true,
    token,
    email,
    phoneVerified: options?.phoneVerified === true,
    phoneNumber:
      typeof options?.phoneNumber === 'string' && options.phoneNumber.trim().length > 0
        ? options.phoneNumber.trim()
        : null,
  });
}

export async function updateAuthState(patch: Partial<AuthState>): Promise<AuthState> {
  const current = await getAuthState();
  const next = normalizeAuthState({
    ...current,
    ...patch,
    token: patch.token ?? current.token,
    email: patch.email ?? current.email,
    phoneVerified:
      typeof patch.phoneVerified === 'boolean' ? patch.phoneVerified : current.phoneVerified,
    phoneNumber:
      typeof patch.phoneNumber === 'string'
        ? patch.phoneNumber
        : current.phoneNumber,
  });

  await setAuthState(next);
  return next;
}

export async function logout(): Promise<void> {
  await AsyncStorage.removeItem(AUTH_KEY);
}
