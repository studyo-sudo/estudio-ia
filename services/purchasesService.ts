import Constants from 'expo-constants';
import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';
import {
  RC_CREDITS_BASIC_PRODUCT_ID,
  RC_CREDITS_LARGE_PRODUCT_ID,
  RC_CREDITS_MEDIUM_PRODUCT_ID,
  RC_CREDITS_OFFERING_ID,
  RC_ANDROID_API_KEY,
  RC_IOS_API_KEY,
  RC_PREMIUM_ENTITLEMENT_ID,
  RC_OFFERING_ID,
} from '../constants/env';
import { addCredits, setPlan } from './billingStorage';

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
  const current = offerings.all[RC_OFFERING_ID] || offerings.current;
  if (!current || current.availablePackages.length === 0) {
    throw new Error('No hay paquetes de compra disponibles.');
  }

  const premiumPackage =
    current.availablePackages.find((pkg) => pkg.packageType === Purchases.PACKAGE_TYPE.MONTHLY) ||
    current.availablePackages[0];

  await Purchases.purchasePackage(premiumPackage);
  await syncPlanFromRevenueCat();
}

async function purchaseRevenueCatPackageByProductId(productId: string) {
  if (!canUseNativePurchases()) {
    throw new Error('Las compras nativas no están configuradas para esta plataforma.');
  }

  const offerings = await Purchases.getOfferings();
  const current = offerings.all[RC_CREDITS_OFFERING_ID] || offerings.current;

  if (!current) {
    throw new Error('No hay ofertas de créditos disponibles.');
  }

  const targetPackage = current.availablePackages.find(
    (pkg) => pkg.product.identifier === productId
  );

  if (!targetPackage) {
    throw new Error(`No se encontró el paquete ${productId}.`);
  }

  await Purchases.purchasePackage(targetPackage);
}

export async function purchaseCreditPack(
  credits: number,
  packSize: 'basic' | 'medium' | 'large'
) {
  const productId =
    packSize === 'basic'
      ? RC_CREDITS_BASIC_PRODUCT_ID
      : packSize === 'medium'
      ? RC_CREDITS_MEDIUM_PRODUCT_ID
      : RC_CREDITS_LARGE_PRODUCT_ID;

  await purchaseRevenueCatPackageByProductId(productId);
  await addCredits(credits);
}

export async function restorePurchasesAndSyncPlan() {
  if (!canUseNativePurchases()) return;
  await Purchases.restorePurchases();
  await syncPlanFromRevenueCat();
}
