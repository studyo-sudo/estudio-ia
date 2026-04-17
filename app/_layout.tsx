import * as NavigationBar from 'expo-navigation-bar';
import { Stack } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { AppPreferencesProvider, useAppPreferences } from '../contexts/AppPreferencesContext';
import '../services/calendarNotifications';

export default function RootLayout() {
  return (
    <AppPreferencesProvider>
      <RootLayoutContent />
    </AppPreferencesProvider>
  );
}

function RootLayoutContent() {
  const { colors, t, isReady } = useAppPreferences();

  const hideAndroidNavBar = useCallback(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    NavigationBar.setVisibilityAsync('hidden').catch(() => {});
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }
  }, [isReady]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]} onTouchStart={hideAndroidNavBar}>
      {Platform.OS === 'ios' ? (
        <KeyboardAvoidingView style={styles.flex} behavior="padding">
          <AppStack colors={colors} t={t} />
        </KeyboardAvoidingView>
      ) : (
        <View style={styles.flex}>
          <AppStack colors={colors} t={t} />
        </View>
      )}
    </View>
  );
}

function AppStack({
  colors,
  t,
}: {
  colors: ReturnType<typeof useAppPreferences>['colors'];
  t: ReturnType<typeof useAppPreferences>['t'];
}) {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          color: colors.text,
          fontWeight: '700',
        },
        contentStyle: {
          backgroundColor: colors.background,
        },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="phone-verification" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="file" options={{ title: t('file.title') }} />
      <Stack.Screen name="audio" options={{ title: t('file.source.audio') }} />
      <Stack.Screen name="exam" options={{ title: t('exam.title') }} />
      <Stack.Screen name="exam-model" options={{ title: t('examModel.title') }} />
      <Stack.Screen name="problem-solver" options={{ title: t('problem.title') }} />
      <Stack.Screen name="flashcards" options={{ title: t('flashcards.title') }} />
      <Stack.Screen name="flashcards-history" options={{ title: t('flashcardsHistory.title') }} />
      <Stack.Screen name="saved-item" options={{ title: t('saved.title') }} />
      <Stack.Screen name="pricing" options={{ title: t('pricing.title') }} />
      <Stack.Screen name="credits" options={{ title: t('credits.title') }} />
      <Stack.Screen name="tutor" options={{ title: t('tutor.title') }} />
      <Stack.Screen name="tutor-chat" options={{ title: t('tutor.title') }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
});
