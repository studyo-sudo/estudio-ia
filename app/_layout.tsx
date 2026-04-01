import * as NavigationBar from 'expo-navigation-bar';
import { Stack } from 'expo-router';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { Platform } from 'react-native';

export default function RootLayout() {
  useEffect(() => {
    SystemUI.setBackgroundColorAsync('#0f172a').catch(() => {});

    if (Platform.OS === 'android') {
      NavigationBar.setButtonStyleAsync('light').catch(() => {});
    }
  }, []);

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#0f172a',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          color: '#ffffff',
          fontWeight: '700',
        },
        contentStyle: {
          backgroundColor: '#0f172a',
        },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="audio" options={{ title: 'Grabar clase' }} />
      <Stack.Screen name="exam" options={{ title: 'Examen' }} />
      <Stack.Screen name="exam-model" options={{ title: 'Subir examenes' }} />
      <Stack.Screen name="flashcards" options={{ title: 'Flashcards' }} />
      <Stack.Screen name="flashcards-history" options={{ title: 'Flashcards' }} />
      <Stack.Screen name="saved-item" options={{ title: 'Guardado' }} />
      <Stack.Screen name="pricing" options={{ title: 'Planes' }} />
      <Stack.Screen name="credits" options={{ title: 'Creditos' }} />
    </Stack>
  );
}
