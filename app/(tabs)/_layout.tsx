import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, Tabs, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { initializePurchases } from '../../services/purchasesService';
import { getAuthState } from '../../services/authStorage';
import { APP_COLORS } from '../../constants/theme';

export default function TabLayout() {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    initializePurchases();
  }, []);

  const checkAuth = useCallback(async () => {
    const auth = await getAuthState();
    setIsAuthenticated(Boolean(auth.token));
    setIsCheckingAuth(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setIsCheckingAuth(true);
      void checkAuth();
    }, [checkAuth])
  );

  if (isCheckingAuth) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: APP_COLORS.background,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator size="large" color={APP_COLORS.text} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: {
          backgroundColor: APP_COLORS.background,
        },
        tabBarStyle: {
          backgroundColor: APP_COLORS.background,
          borderTopColor: APP_COLORS.creamSoft,
        },
        tabBarActiveTintColor: APP_COLORS.text,
        tabBarInactiveTintColor: APP_COLORS.textMuted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Historial',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'time' : 'time-outline'} size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: 'Tienda',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'cart' : 'cart-outline'} size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Cuenta',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={28} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
