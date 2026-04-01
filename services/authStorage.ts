import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_KEY = 'auth_state_v1';

export type AuthState = {
  isAuthenticated: boolean;
  token: string | null;
  email: string | null;
};

const DEFAULT_AUTH_STATE: AuthState = {
  isAuthenticated: false,
  token: null,
  email: null,
};

export async function getAuthState(): Promise<AuthState> {
  try {
    const raw = await AsyncStorage.getItem(AUTH_KEY);
    if (!raw) return DEFAULT_AUTH_STATE;
    const parsed = JSON.parse(raw) as Partial<AuthState>;

    if (!parsed?.token || typeof parsed.token !== 'string') {
      return DEFAULT_AUTH_STATE;
    }

    return {
      isAuthenticated: true,
      token: parsed.token,
      email: typeof parsed.email === 'string' ? parsed.email : null,
    };
  } catch {
    return DEFAULT_AUTH_STATE;
  }
}

export async function setAuthState(state: AuthState): Promise<void> {
  await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(state));
}

export async function login(token: string, email: string): Promise<void> {
  await setAuthState({ isAuthenticated: true, token, email });
}

export async function logout(): Promise<void> {
  await AsyncStorage.removeItem(AUTH_KEY);
}