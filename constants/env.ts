import { Platform } from 'react-native';

const defaultApiBaseUrl =
  Platform.OS === 'web'
    ? 'http://localhost:3000'
    : 'https://studyo-ai-backend.onrender.com';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || defaultApiBaseUrl;
export const RC_ANDROID_API_KEY = process.env.EXPO_PUBLIC_RC_ANDROID_API_KEY?.trim();
export const RC_IOS_API_KEY = process.env.EXPO_PUBLIC_RC_IOS_API_KEY?.trim();
export const RC_PREMIUM_ENTITLEMENT_ID =
  process.env.EXPO_PUBLIC_RC_PREMIUM_ENTITLEMENT_ID?.trim() || 'premium';
export const RC_OFFERING_ID = process.env.EXPO_PUBLIC_RC_OFFERING_ID?.trim() || 'default';
export const RC_CREDITS_OFFERING_ID =
  process.env.EXPO_PUBLIC_RC_CREDITS_OFFERING_ID?.trim() || 'default';
export const RC_CREDITS_BASIC_PRODUCT_ID =
  process.env.EXPO_PUBLIC_RC_CREDITS_BASIC_PRODUCT_ID?.trim() || 'studyo_ai_credits_basic';
export const RC_CREDITS_STARTER_PRODUCT_ID =
  process.env.EXPO_PUBLIC_RC_CREDITS_STARTER_PRODUCT_ID?.trim() || 'studyo_ai_credits_starter';
export const RC_CREDITS_MEDIUM_PRODUCT_ID =
  process.env.EXPO_PUBLIC_RC_CREDITS_MEDIUM_PRODUCT_ID?.trim() || 'studyo_ai_credits_medium';
export const RC_CREDITS_LARGE_PRODUCT_ID =
  process.env.EXPO_PUBLIC_RC_CREDITS_LARGE_PRODUCT_ID?.trim() || 'studyo_ai_credits_large';
export const ADMOB_REWARDED_AD_UNIT_ID =
  process.env.EXPO_PUBLIC_ADMOB_REWARDED_AD_UNIT_ID?.trim();
