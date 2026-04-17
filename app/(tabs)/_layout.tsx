import { Redirect, Tabs, useFocusEffect, usePathname, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import AppBottomNav from '../../components/AppBottomNav';
import { useAppPreferences } from '../../contexts/AppPreferencesContext';
import { resolvePostAuthRoute } from '../../services/authRouting';
import { initializePurchases } from '../../services/purchasesService';
import { getAuthState } from '../../services/authStorage';

export default function TabLayout() {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [redirectTo, setRedirectTo] = useState<
    '/login' | '/phone-verification' | '/(tabs)' | null
  >(null);
  const { colors, t } = useAppPreferences();
  const router = useRouter();
  const pathname = usePathname();
  const activeTab =
    pathname.includes('/explore')
      ? 'history'
      : pathname.includes('/calendar')
      ? 'calendar'
      : pathname.includes('/shop')
      ? 'shop'
      : pathname.includes('/account')
      ? 'account'
      : 'home';

  useEffect(() => {
    initializePurchases();
  }, []);

  const checkAuth = useCallback(async () => {
    const auth = await getAuthState();
    if (!auth.token) {
      setIsAuthenticated(false);
      setRedirectTo('/login');
      setIsCheckingAuth(false);
      return;
    }

    const route = await resolvePostAuthRoute();
    if (route !== '/(tabs)') {
      setIsAuthenticated(true);
      setRedirectTo(route);
      setIsCheckingAuth(false);
      return;
    }

    setIsAuthenticated(true);
    setRedirectTo(null);
    setIsCheckingAuth(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setIsCheckingAuth(true);
      void checkAuth();
    }, [checkAuth])
  );

  useEffect(() => {
    if (redirectTo && redirectTo !== '/(tabs)') {
      void router.replace(redirectTo);
    }
  }, [redirectTo, router]);

  if (isCheckingAuth) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator size="large" color={colors.text} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (redirectTo && redirectTo !== '/(tabs)') {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator size="large" color={colors.text} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.tabsArea}>
        <Tabs
          screenOptions={{
            headerShown: false,
            sceneStyle: {
              backgroundColor: colors.background,
            },
            tabBarStyle: {
              display: 'none',
            },
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: t('nav.home'),
            }}
          />
          <Tabs.Screen
            name="explore"
            options={{
              title: t('nav.history'),
            }}
          />
          <Tabs.Screen
            name="calendar"
            options={{
              title: t('nav.calendar'),
            }}
          />
          <Tabs.Screen
            name="shop"
            options={{
              title: t('nav.shop'),
            }}
          />
          <Tabs.Screen
            name="account"
            options={{
              title: t('nav.account'),
            }}
          />
        </Tabs>
        <View style={styles.footerSpacer} pointerEvents="none" />
      </View>
      <AppBottomNav activeTab={activeTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  tabsArea: {
    flex: 1,
  },
  footerSpacer: {
    height: 64,
  },
});
