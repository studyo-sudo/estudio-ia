import { Platform } from 'react-native';

function readEnv(name: string) {
  const value = process.env[name];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function readBooleanEnv(name: string, defaultValue: boolean) {
  const value = readEnv(name);

  if (!value) return defaultValue;

  return value.toLowerCase() === 'true';
}

const defaultApiBaseUrl =
  Platform.OS === 'web'
    ? 'http://localhost:3000'
    : 'https://9765-201-219-109-168.ngrok-free.app';

export const API_BASE_URL = readEnv('EXPO_PUBLIC_API_BASE_URL') || defaultApiBaseUrl;
export const ENABLE_FAKE_ADS = readBooleanEnv('EXPO_PUBLIC_ENABLE_FAKE_ADS', true);
export const ENABLE_FAKE_BILLING = readBooleanEnv('EXPO_PUBLIC_ENABLE_FAKE_BILLING', true);
export const RC_ANDROID_API_KEY = readEnv('EXPO_PUBLIC_RC_ANDROID_API_KEY');
export const RC_IOS_API_KEY = readEnv('EXPO_PUBLIC_RC_IOS_API_KEY');
export const RC_PREMIUM_ENTITLEMENT_ID =
  readEnv('EXPO_PUBLIC_RC_PREMIUM_ENTITLEMENT_ID') || 'premium';
