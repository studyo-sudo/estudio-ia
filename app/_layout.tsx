import * as NavigationBar from 'expo-navigation-bar';
import * as Notifications from 'expo-notifications';
import { router, Stack } from 'expo-router';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { APP_COLORS } from '../constants/theme';
import { configureStudyReminderChannel } from '../services/studyReminderService';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(APP_COLORS.background).catch(() => {});

    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync(APP_COLORS.background).catch(() => {});
      NavigationBar.setButtonStyleAsync('dark').catch(() => {});
    }

    void configureStudyReminderChannel();

    let openedFromReminder = false;
    const openStudyRoute = () => {
      if (openedFromReminder) {
        return;
      }

      openedFromReminder = true;
      router.push('/study-route' as never);
    };

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const screen = response.notification.request.content.data?.screen;

      if (screen === 'study-route') {
        openStudyRoute();
      }
    });

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      const screen = response?.notification.request.content.data?.screen;

      if (screen === 'study-route') {
        openStudyRoute();
      }
    });

    return () => subscription.remove();
  }, []);

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: APP_COLORS.background,
        },
        headerTintColor: APP_COLORS.text,
        headerTitleStyle: {
          color: APP_COLORS.text,
          fontWeight: '700',
        },
        contentStyle: {
          backgroundColor: APP_COLORS.background,
        },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="file" options={{ title: 'Archivo' }} />
      <Stack.Screen name="audio" options={{ title: 'Grabar clase' }} />
      <Stack.Screen name="exam" options={{ title: 'Examen' }} />
      <Stack.Screen name="exam-model" options={{ title: 'Subir examenes' }} />
      <Stack.Screen name="problem-solver" options={{ title: 'Resolver problemas' }} />
      <Stack.Screen name="flashcards" options={{ title: 'Flashcards' }} />
      <Stack.Screen name="flashcards-history" options={{ title: 'Flashcards' }} />
      <Stack.Screen name="saved-item" options={{ title: 'Guardado' }} />
      <Stack.Screen name="pricing" options={{ title: 'Planes' }} />
      <Stack.Screen name="credits" options={{ title: 'Creditos' }} />
      <Stack.Screen name="study-route" options={{ title: 'Ruta de estudio' }} />
      <Stack.Screen name="tutor" options={{ title: 'Tutor' }} />
      <Stack.Screen name="tutor-chat" options={{ title: 'Chat Tutor' }} />
    </Stack>
  );
}
