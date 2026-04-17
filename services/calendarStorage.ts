import AsyncStorage from '@react-native-async-storage/async-storage';

const CALENDAR_STORAGE_KEY = 'study_calendar_entries_v1';

export type CalendarEntry = {
  id: string;
  dateKey: string;
  hour: number;
  text: string;
  reminderMinutesBefore: number | null;
  notificationId: string | null;
  createdAt: number;
  updatedAt: number;
};

function createCalendarEntryId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function isValidDateKey(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isCalendarEntryCandidate(value: unknown): value is CalendarEntry {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const entry = value as CalendarEntry;

  return (
    typeof entry.id === 'string' &&
    typeof entry.dateKey === 'string' &&
    isValidDateKey(entry.dateKey) &&
    typeof entry.hour === 'number' &&
    Number.isInteger(entry.hour) &&
    entry.hour >= 0 &&
    entry.hour <= 23 &&
    typeof entry.text === 'string' &&
    (entry.reminderMinutesBefore === null || typeof entry.reminderMinutesBefore === 'number') &&
    (entry.notificationId === null || typeof entry.notificationId === 'string') &&
    typeof entry.createdAt === 'number' &&
    typeof entry.updatedAt === 'number'
  );
}

export function formatCalendarDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function parseCalendarDateKey(dateKey: string) {
  const [yearText, monthText, dayText] = dateKey.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

export function buildCalendarDateTime(dateKey: string, hour: number) {
  const [yearText, monthText, dayText] = dateKey.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  return new Date(year, month - 1, day, hour, 0, 0, 0);
}

export function formatCalendarDateLabel(dateKey: string) {
  const date = parseCalendarDateKey(dateKey);
  const formatted = date.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function formatCalendarHour(hour: number) {
  return `${String(hour).padStart(2, '0')}:00`;
}

async function readStoredEntries(): Promise<CalendarEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(CALENDAR_STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isCalendarEntryCandidate).map((entry) => ({
      ...entry,
      text: entry.text.trim(),
    }));
  } catch {
    return [];
  }
}

async function writeStoredEntries(entries: CalendarEntry[]) {
  const normalized = [...entries].sort((a, b) => {
    if (a.dateKey !== b.dateKey) {
      return a.dateKey.localeCompare(b.dateKey);
    }

    if (a.hour !== b.hour) {
      return a.hour - b.hour;
    }

    return b.updatedAt - a.updatedAt;
  });

  await AsyncStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(normalized));
}

export function createCalendarEntry(
  dateKey: string,
  hour: number,
  text: string,
  existing?: Partial<CalendarEntry>
): CalendarEntry {
  const now = Date.now();

  return {
    id: existing?.id ?? createCalendarEntryId(),
    dateKey,
    hour,
    text: text.trim(),
    reminderMinutesBefore: existing?.reminderMinutesBefore ?? null,
    notificationId: existing?.notificationId ?? null,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

export async function getCalendarEntries(): Promise<CalendarEntry[]> {
  return readStoredEntries();
}

export async function getCalendarEntriesForDate(dateKey: string): Promise<CalendarEntry[]> {
  const entries = await readStoredEntries();
  return entries.filter((entry) => entry.dateKey === dateKey).sort((a, b) => a.hour - b.hour);
}

export async function getCalendarEntryForDateHour(
  dateKey: string,
  hour: number
): Promise<CalendarEntry | null> {
  const entries = await readStoredEntries();
  return entries.find((entry) => entry.dateKey === dateKey && entry.hour === hour) || null;
}

export async function saveCalendarEntry(entry: CalendarEntry): Promise<CalendarEntry> {
  const current = await readStoredEntries();
  const normalizedEntry: CalendarEntry = {
    ...entry,
    text: entry.text.trim(),
    updatedAt: Date.now(),
  };

  const existingIndex = current.findIndex(
    (item) =>
      item.id === normalizedEntry.id ||
      (item.dateKey === normalizedEntry.dateKey && item.hour === normalizedEntry.hour)
  );

  if (existingIndex >= 0) {
    normalizedEntry.createdAt = current[existingIndex].createdAt;
  }

  const withoutSlot = current.filter(
    (item) =>
      item.id !== normalizedEntry.id &&
      !(item.dateKey === normalizedEntry.dateKey && item.hour === normalizedEntry.hour)
  );

  await writeStoredEntries([normalizedEntry, ...withoutSlot]);
  return normalizedEntry;
}

export async function deleteCalendarEntry(id: string): Promise<CalendarEntry | null> {
  const current = await readStoredEntries();
  let removed: CalendarEntry | null = null;

  const next = current.filter((entry) => {
    if (entry.id === id) {
      removed = entry;
      return false;
    }

    return true;
  });

  await writeStoredEntries(next);
  return removed;
}
