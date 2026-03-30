import AsyncStorage from '@react-native-async-storage/async-storage';

const USAGE_KEY = 'usage_limits_v1';

type WeeklyUsage = {
  weekKey: string;
  pdfCount: number;
  imageCount: number;
  examModelCount: number;
};

const DEFAULT_USAGE: WeeklyUsage = {
  weekKey: '',
  pdfCount: 0,
  imageCount: 0,
  examModelCount: 0,
};

function getWeekKey(date = new Date()) {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const diffInDays = Math.floor(
    (date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)
  );
  const week = Math.ceil((diffInDays + startOfYear.getDay() + 1) / 7);
  return `${date.getFullYear()}-W${week}`;
}

async function getCurrentUsage(): Promise<WeeklyUsage> {
  try {
    const raw = await AsyncStorage.getItem(USAGE_KEY);
    const currentWeekKey = getWeekKey();

    if (!raw) {
      return {
        ...DEFAULT_USAGE,
        weekKey: currentWeekKey,
      };
    }

    const parsed = JSON.parse(raw) as WeeklyUsage;

    if (parsed.weekKey !== currentWeekKey) {
      return {
        ...DEFAULT_USAGE,
        weekKey: currentWeekKey,
      };
    }

    return {
      weekKey: currentWeekKey,
      pdfCount: typeof parsed.pdfCount === 'number' ? parsed.pdfCount : 0,
      imageCount: typeof parsed.imageCount === 'number' ? parsed.imageCount : 0,
      examModelCount:
        typeof parsed.examModelCount === 'number' ? parsed.examModelCount : 0,
    };
  } catch {
    return {
      ...DEFAULT_USAGE,
      weekKey: getWeekKey(),
    };
  }
}

async function saveCurrentUsage(usage: WeeklyUsage): Promise<void> {
  await AsyncStorage.setItem(USAGE_KEY, JSON.stringify(usage));
}

export async function getWeeklyUsage() {
  return getCurrentUsage();
}

export async function canUsePdfFree(): Promise<boolean> {
  const usage = await getCurrentUsage();
  return usage.pdfCount < 3;
}

export async function registerPdfFreeUse(): Promise<void> {
  const usage = await getCurrentUsage();
  usage.pdfCount += 1;
  await saveCurrentUsage(usage);
}

export async function canUseImageFree(): Promise<boolean> {
  const usage = await getCurrentUsage();
  return usage.imageCount < 3;
}

export async function registerImageFreeUse(): Promise<void> {
  const usage = await getCurrentUsage();
  usage.imageCount += 1;
  await saveCurrentUsage(usage);
}

export async function canUseExamModelFree(): Promise<boolean> {
  const usage = await getCurrentUsage();
  return usage.examModelCount < 1;
}

export async function registerExamModelFreeUse(): Promise<void> {
  const usage = await getCurrentUsage();
  usage.examModelCount += 1;
  await saveCurrentUsage(usage);
}