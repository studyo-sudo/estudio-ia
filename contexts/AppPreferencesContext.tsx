import * as NavigationBar from 'expo-navigation-bar';
import * as SystemUI from 'expo-system-ui';
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import {
  AppLanguage,
  AppPreferences,
  AppThemeMode,
  DEFAULT_APP_PREFERENCES,
  getStoredAppPreferences,
  setStoredAppLanguage,
  setStoredAppThemeMode,
} from '../services/appPreferencesStorage';
import { getLocaleForLanguage, translate } from '../services/appI18n';
import { AppColors, getAppColors } from '../constants/theme';

type AppPreferencesContextValue = {
  language: AppLanguage;
  themeMode: AppThemeMode;
  colors: AppColors;
  locale: string;
  isReady: boolean;
  t: (key: string, params?: Record<string, string | number | undefined>) => string;
  setLanguage: (language: AppLanguage) => Promise<void>;
  setThemeMode: (themeMode: AppThemeMode) => Promise<void>;
};

const AppPreferencesContext = createContext<AppPreferencesContextValue | null>(null);

export function AppPreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<AppPreferences>(DEFAULT_APP_PREFERENCES);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let active = true;

    void (async () => {
      const stored = await getStoredAppPreferences();
      if (!active) {
        return;
      }

      setPreferences(stored);
      setIsReady(true);
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const colors = getAppColors(preferences.themeMode);
    SystemUI.setBackgroundColorAsync(colors.background).catch(() => {});

    if (Platform.OS === 'android') {
      NavigationBar.setPositionAsync('absolute').catch(() => {});
      NavigationBar.setVisibilityAsync('hidden').catch(() => {});
      NavigationBar.setBehaviorAsync('overlay-swipe').catch(() => {});
      NavigationBar.setButtonStyleAsync(preferences.themeMode === 'dark' ? 'light' : 'dark').catch(
        () => {}
      );
      NavigationBar.setBackgroundColorAsync(colors.background).catch(() => {});
    }
  }, [preferences.themeMode]);

  const setLanguage = async (language: AppLanguage) => {
    setPreferences((current) => ({ ...current, language }));
    await setStoredAppLanguage(language);
  };

  const setThemeMode = async (themeMode: AppThemeMode) => {
    setPreferences((current) => ({ ...current, themeMode }));
    await setStoredAppThemeMode(themeMode);
  };

  const value = useMemo<AppPreferencesContextValue>(() => {
    const colors = getAppColors(preferences.themeMode);

    return {
      language: preferences.language,
      themeMode: preferences.themeMode,
      colors,
      locale: getLocaleForLanguage(preferences.language),
      isReady,
      t: (key, params) => translate(preferences.language, key, params),
      setLanguage,
      setThemeMode,
    };
  }, [isReady, preferences.language, preferences.themeMode]);

  return <AppPreferencesContext.Provider value={value}>{children}</AppPreferencesContext.Provider>;
}

export function useAppPreferences() {
  const context = useContext(AppPreferencesContext);

  if (!context) {
    throw new Error('useAppPreferences must be used inside AppPreferencesProvider');
  }

  return context;
}
