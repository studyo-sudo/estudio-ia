import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppLanguage = 'es' | 'en' | 'pt' | 'fr';
export type AppThemeMode = 'dark' | 'light';

export type AppPreferences = {
  language: AppLanguage;
  themeMode: AppThemeMode;
};

const LANGUAGE_KEY = '@studyo-ai/preferences/language';
const THEME_MODE_KEY = '@studyo-ai/preferences/theme-mode';

export const DEFAULT_APP_PREFERENCES: AppPreferences = {
  language: 'es',
  themeMode: 'dark',
};

export async function getStoredAppPreferences(): Promise<AppPreferences> {
  const [[, storedLanguage], [, storedThemeMode]] = await AsyncStorage.multiGet([
    LANGUAGE_KEY,
    THEME_MODE_KEY,
  ]);

  return {
    language: isAppLanguage(storedLanguage) ? storedLanguage : DEFAULT_APP_PREFERENCES.language,
    themeMode: isAppThemeMode(storedThemeMode)
      ? storedThemeMode
      : DEFAULT_APP_PREFERENCES.themeMode,
  };
}

export async function setStoredAppLanguage(language: AppLanguage) {
  await AsyncStorage.setItem(LANGUAGE_KEY, language);
}

export async function setStoredAppThemeMode(themeMode: AppThemeMode) {
  await AsyncStorage.setItem(THEME_MODE_KEY, themeMode);
}

function isAppLanguage(value: string | null): value is AppLanguage {
  return value === 'es' || value === 'en' || value === 'pt' || value === 'fr';
}

function isAppThemeMode(value: string | null): value is AppThemeMode {
  return value === 'dark' || value === 'light';
}
