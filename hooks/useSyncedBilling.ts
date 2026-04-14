import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { BillingState, getBillingState } from '../services/billingStorage';
import { canUseNativePurchases, syncPlanFromRevenueCat } from '../services/purchasesService';

const DEFAULT_BILLING: BillingState = {
  plan: 'free',
  credits: 0,
  creditGrants: [],
};

export function useSyncedBilling() {
  const [billing, setBilling] = useState<BillingState>(DEFAULT_BILLING);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const nativePurchasesEnabled = canUseNativePurchases();
  const mountedRef = useRef(true);
  const loadingRef = useRef<Promise<BillingState> | null>(null);

  const refreshBilling = useCallback(async () => {
    if (loadingRef.current) {
      return loadingRef.current;
    }

    const task = (async () => {
      if (mountedRef.current) {
        setIsRefreshing(true);
      }

      try {
        if (nativePurchasesEnabled) {
          await syncPlanFromRevenueCat().catch(() => {});
        }

        const state = await getBillingState();

        if (mountedRef.current) {
          setBilling(state);
        }

        return state;
      } finally {
        if (mountedRef.current) {
          setIsRefreshing(false);
        }

        loadingRef.current = null;
      }
    })();

    loadingRef.current = task;
    return task;
  }, [nativePurchasesEnabled]);

  useEffect(() => {
    mountedRef.current = true;
    void refreshBilling();

    return () => {
      mountedRef.current = false;
    };
  }, [refreshBilling]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void refreshBilling();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [refreshBilling]);

  return {
    billing,
    isRefreshing,
    nativePurchasesEnabled,
    refreshBilling,
    setBilling,
  };
}
