import AsyncStorage from '@react-native-async-storage/async-storage';

const STUDY_PROGRESS_KEY = 'study_progress_v1';
const DAY_IN_MS = 24 * 60 * 60 * 1000;

export const DEFAULT_STUDY_REMINDER_HOUR = 20;
export const DEFAULT_STUDY_REMINDER_MINUTE = 0;

export type StudyProgressRecord = {
  totalSessions: number;
  streakDays: number;
  lastStudyAt: number | null;
  lastStudyDayKey: string | null;
  reminderEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
  reminderNotificationId: string | null;
  reminderScheduledAt: number | null;
};

export type StudyProgress = StudyProgressRecord & {
  completedToday: boolean;
  lastStudyLabel: string;
  reminderTimeLabel: string;
};

const DEFAULT_RECORD: StudyProgressRecord = {
  totalSessions: 0,
  streakDays: 0,
  lastStudyAt: null,
  lastStudyDayKey: null,
  reminderEnabled: false,
  reminderHour: DEFAULT_STUDY_REMINDER_HOUR,
  reminderMinute: DEFAULT_STUDY_REMINDER_MINUTE,
  reminderNotificationId: null,
  reminderScheduledAt: null,
};

function getLocalDayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function normalizeHour(value: unknown) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return DEFAULT_STUDY_REMINDER_HOUR;
  }

  return Math.min(23, Math.max(0, Math.trunc(value)));
}

function normalizeMinute(value: unknown) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return DEFAULT_STUDY_REMINDER_MINUTE;
  }

  return Math.min(59, Math.max(0, Math.trunc(value)));
}

function normalizeRecord(raw: unknown): StudyProgressRecord {
  const parsed = raw as Partial<StudyProgressRecord> | null;

  return {
    totalSessions:
      typeof parsed?.totalSessions === 'number' && !Number.isNaN(parsed.totalSessions)
        ? Math.max(0, Math.trunc(parsed.totalSessions))
        : DEFAULT_RECORD.totalSessions,
    streakDays:
      typeof parsed?.streakDays === 'number' && !Number.isNaN(parsed.streakDays)
        ? Math.max(0, Math.trunc(parsed.streakDays))
        : DEFAULT_RECORD.streakDays,
    lastStudyAt:
      typeof parsed?.lastStudyAt === 'number' && !Number.isNaN(parsed.lastStudyAt)
        ? parsed.lastStudyAt
        : DEFAULT_RECORD.lastStudyAt,
    lastStudyDayKey:
      typeof parsed?.lastStudyDayKey === 'string' && parsed.lastStudyDayKey.trim().length > 0
        ? parsed.lastStudyDayKey
        : DEFAULT_RECORD.lastStudyDayKey,
    reminderEnabled: Boolean(parsed?.reminderEnabled),
    reminderHour: normalizeHour(parsed?.reminderHour),
    reminderMinute: normalizeMinute(parsed?.reminderMinute),
    reminderNotificationId:
      typeof parsed?.reminderNotificationId === 'string' &&
      parsed.reminderNotificationId.trim().length > 0
        ? parsed.reminderNotificationId
        : DEFAULT_RECORD.reminderNotificationId,
    reminderScheduledAt:
      typeof parsed?.reminderScheduledAt === 'number' && !Number.isNaN(parsed.reminderScheduledAt)
        ? parsed.reminderScheduledAt
        : DEFAULT_RECORD.reminderScheduledAt,
  };
}

function formatReminderTime(hour: number, minute: number) {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatLastStudyLabel(lastStudyAt: number | null) {
  if (!lastStudyAt) {
    return 'Aun no estudiaste';
  }

  const now = new Date();
  const todayKey = getLocalDayKey(now);
  const yesterdayKey = getLocalDayKey(new Date(now.getTime() - DAY_IN_MS));
  const studyDayKey = getLocalDayKey(new Date(lastStudyAt));

  if (studyDayKey === todayKey) {
    return 'Hoy';
  }

  if (studyDayKey === yesterdayKey) {
    return 'Ayer';
  }

  return new Date(lastStudyAt).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function buildProgress(record: StudyProgressRecord): StudyProgress {
  return {
    ...record,
    completedToday: record.lastStudyDayKey === getLocalDayKey(),
    lastStudyLabel: formatLastStudyLabel(record.lastStudyAt),
    reminderTimeLabel: formatReminderTime(record.reminderHour, record.reminderMinute),
  };
}

async function readRecord(): Promise<StudyProgressRecord> {
  try {
    const raw = await AsyncStorage.getItem(STUDY_PROGRESS_KEY);

    if (!raw) {
      return DEFAULT_RECORD;
    }

    return normalizeRecord(JSON.parse(raw));
  } catch {
    return DEFAULT_RECORD;
  }
}

async function writeRecord(record: StudyProgressRecord): Promise<void> {
  await AsyncStorage.setItem(STUDY_PROGRESS_KEY, JSON.stringify(record));
}

export async function getStudyProgress(): Promise<StudyProgress> {
  return buildProgress(await readRecord());
}

export async function updateStudyProgress(
  patch: Partial<StudyProgressRecord>
): Promise<StudyProgress> {
  const current = await readRecord();
  const next = normalizeRecord({
    ...current,
    ...patch,
  });

  await writeRecord(next);
  return buildProgress(next);
}

export async function markStudySession(): Promise<StudyProgress> {
  const current = await readRecord();
  const now = new Date();
  const todayKey = getLocalDayKey(now);
  const yesterdayKey = getLocalDayKey(new Date(now.getTime() - DAY_IN_MS));
  const alreadyStudiedToday = current.lastStudyDayKey === todayKey;

  const next = normalizeRecord({
    ...current,
    totalSessions: current.totalSessions + 1,
    streakDays: alreadyStudiedToday
      ? current.streakDays
      : current.lastStudyDayKey === yesterdayKey
      ? current.streakDays + 1
      : 1,
    lastStudyAt: now.getTime(),
    lastStudyDayKey: todayKey,
  });

  await writeRecord(next);
  return buildProgress(next);
}
