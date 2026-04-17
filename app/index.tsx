import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet } from 'react-native';
import { useAppPreferences } from '../contexts/AppPreferencesContext';
import { resolvePostAuthRoute } from '../services/authRouting';

export default function IndexScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [redirectTo, setRedirectTo] = useState<
    '/login' | '/phone-verification' | '/(tabs)'
  >('/login');
  const { colors } = useAppPreferences();

  useEffect(() => {
    async function bootstrap() {
      const route = await resolvePostAuthRoute();
      setRedirectTo(route);
      setIsLoading(false);
    }

    void bootstrap();
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.text} />
      </SafeAreaView>
    );
  }

  return <Redirect href={redirectTo} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
