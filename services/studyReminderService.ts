import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import {
  DEFAULT_STUDY_REMINDER_HOUR,
  DEFAULT_STUDY_REMINDER_MINUTE,
  getStudyProgress,
  updateStudyProgress,
} from './studyProgressStorage';

export const STUDY_REMINDER_CHANNEL_ID = 'study-reminders';
const DEFAULT_REMINDER_TITLE = 'Hora de estudiar';
const DEFAULT_REMINDER_BODY = 'Tu ruta de estudio te espera en Studyo Ai.';

export async function configureStudyReminderChannel() {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync(STUDY_REMINDER_CHANNEL_ID, {
    name: 'Recordatorios de estudio',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 200, 150, 200],
  });
}

export async function enableStudyReminder(
  hour = DEFAULT_STUDY_REMINDER_HOUR,
  minute = DEFAULT_STUDY_REMINDER_MINUTE
) {
  await configureStudyReminderChannel();

  const permissions = await Notifications.getPermissionsAsync();
  const permissionState = permissions as {
    granted?: boolean;
    ios?: { status?: Notifications.IosAuthorizationStatus };
  };
  let allowed =
    Boolean(permissionState.granted) ||
    permissionState.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;

  if (!allowed) {
    const requested = await Notifications.requestPermissionsAsync();
    const requestedState = requested as {
      granted?: boolean;
      ios?: { status?: Notifications.IosAuthorizationStatus };
    };
    allowed =
      Boolean(requestedState.granted) ||
      requestedState.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
  }

  if (!allowed) {
    throw new Error('Necesitas permitir notificaciones para activar el recordatorio.');
  }

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: DEFAULT_REMINDER_TITLE,
      body: DEFAULT_REMINDER_BODY,
      data: { screen: 'study-route' },
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: STUDY_REMINDER_CHANNEL_ID,
    },
  });

  return updateStudyProgress({
    reminderEnabled: true,
    reminderHour: hour,
    reminderMinute: minute,
    reminderNotificationId: notificationId,
    reminderScheduledAt: Date.now(),
  });
}

export async function disableStudyReminder() {
  const current = await getStudyProgress();

  if (current.reminderNotificationId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(current.reminderNotificationId);
    } catch {
      // If the schedule is already gone, we still want to clear the saved state.
    }
  }

  return updateStudyProgress({
    reminderEnabled: false,
    reminderNotificationId: null,
    reminderScheduledAt: null,
  });
}
