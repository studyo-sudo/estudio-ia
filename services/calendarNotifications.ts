import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { buildCalendarDateTime, CalendarEntry } from './calendarStorage';

const CALENDAR_NOTIFICATION_CHANNEL = 'study-reminders';

export const REMINDER_OPTIONS: Array<{ label: string; minutesBefore: number | null }> = [
  { label: 'En el momento', minutesBefore: 0 },
  { label: '15 min antes', minutesBefore: 15 },
  { label: '1 hora antes', minutesBefore: 60 },
  { label: '12 horas antes', minutesBefore: 12 * 60 },
  { label: '24 horas antes', minutesBefore: 24 * 60 },
];

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function ensureNotificationChannel() {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync(CALENDAR_NOTIFICATION_CHANNEL, {
    name: 'Recordatorios de estudio',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
  });
}

export async function ensureCalendarNotificationsEnabled() {
  if (Platform.OS === 'web') {
    return false;
  }

  await ensureNotificationChannel();

  const current = (await Notifications.getPermissionsAsync()) as {
    status?: string;
    granted?: boolean;
  };

  if (current.status === 'granted' || current.granted === true) {
    return true;
  }

  const requested = (await Notifications.requestPermissionsAsync()) as {
    status?: string;
    granted?: boolean;
  };

  return requested.status === 'granted' || requested.granted === true;
}

export async function cancelCalendarReminder(notificationId?: string | null) {
  if (!notificationId) {
    return;
  }

  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // Ignore stale ids. The reminder may have been removed already.
  }
}

export async function scheduleCalendarReminder(
  entry: CalendarEntry,
  minutesBefore: number | null,
  previousNotificationId?: string | null
) {
  if (minutesBefore === null) {
    await cancelCalendarReminder(previousNotificationId);
    return null;
  }

  if (Platform.OS === 'web') {
    throw new Error('Los recordatorios solo estan disponibles en Android o iPhone.');
  }

  const eventDate = buildCalendarDateTime(entry.dateKey, entry.hour);
  const reminderDate = new Date(eventDate.getTime() - minutesBefore * 60_000);

  if (reminderDate.getTime() <= Date.now()) {
    throw new Error('El recordatorio queda en el pasado. Elige menos anticipacion.');
  }

  const enabled = await ensureCalendarNotificationsEnabled();
  if (!enabled) {
    throw new Error('Necesitas permisos de notificaciones para crear este recordatorio.');
  }

  await cancelCalendarReminder(previousNotificationId);

  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Recordatorio de estudio',
      body: entry.text.trim() || 'Tienes un recordatorio pendiente.',
      sound: 'default',
      data: {
        entryId: entry.id,
        dateKey: entry.dateKey,
        hour: entry.hour,
        text: entry.text,
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: reminderDate,
      channelId: CALENDAR_NOTIFICATION_CHANNEL,
    },
  });
}

export function formatReminderLabel(minutesBefore: number | null) {
  if (minutesBefore === null) {
    return 'Sin recordatorio';
  }

  if (minutesBefore === 0) {
    return 'En el momento';
  }

  if (minutesBefore % 60 === 0) {
    const hours = minutesBefore / 60;
    return hours === 1 ? '1 hora antes' : `${hours} horas antes`;
  }

  return `${minutesBefore} min antes`;
}
