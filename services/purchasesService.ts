import Constants from 'expo-constants';
import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';
import {
  RC_ANDROID_API_KEY,
  RC_IOS_API_KEY,
  RC_PREMIUM_ENTITLEMENT_ID,
} from '../constants/env';
import { setPlan } from './billingStorage';

function isNativeMobile() {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

function isExpoGo() {
  return Constants.executionEnvironment === 'storeClient';
}

function getApiKeyForPlatform() {
  if (Platform.OS === 'ios') return RC_IOS_API_KEY;
  if (Platform.OS === 'android') return RC_ANDROID_API_KEY;
  return undefined;
}

export function canUseNativePurchases() {
  return Boolean(isNativeMobile() && !isExpoGo() && getApiKeyForPlatform());
}

export function initializePurchases() {
  if (!canUseNativePurchases()) return;

  Purchases.setLogLevel(__DEV__ ? Purchases.LOG_LEVEL.DEBUG : Purchases.LOG_LEVEL.INFO);
  Purchases.configure({
    apiKey: getApiKeyForPlatform()!,
  });
}

export async function syncPlanFromRevenueCat() {
  if (!canUseNativePurchases()) return;
  const info = await Purchases.getCustomerInfo();
  const hasPremium = Boolean(info.entitlements.active[RC_PREMIUM_ENTITLEMENT_ID]);
  await setPlan(hasPremium ? 'premium' : 'free');
}

export async function purchasePremiumPlan() {
  if (!canUseNativePurchases()) {
    throw new Error('Las compras nativas no están configuradas para esta plataforma.');
  }

  const offerings = await Purchases.getOfferings();
  const current = offerings.current;
  if (!current || current.availablePackages.length === 0) {
    throw new Error('No hay paquetes de compra disponibles.');
  }

  const premiumPackage =
    current.availablePackages.find((pkg) => pkg.packageType === Purchases.PACKAGE_TYPE.MONTHLY) ||
    current.availablePackages[0];

  await Purchases.purchasePackage(premiumPackage);
  await syncPlanFromRevenueCat();
}

export async function restorePurchasesAndSyncPlan() {
  if (!canUseNativePurchases()) return;
  await Purchases.restorePurchases();
  await syncPlanFromRevenueCat();
}
