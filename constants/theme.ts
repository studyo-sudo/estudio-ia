import type { AppThemeMode } from '../services/appPreferencesStorage';

export type AppColors = {
  background: string;
  backgroundMuted: string;
  surface: string;
  surfaceAlt: string;
  surfaceDeep: string;
  cream: string;
  creamMuted: string;
  creamSoft: string;
  creamStrong: string;
  accentText: string;
  overlay: string;
  shadow: string;
  text: string;
  textMuted: string;
};

export const DARK_COLORS: AppColors = {
  background: '#0f172a',
  backgroundMuted: '#111d33',
  surface: '#16233b',
  surfaceAlt: '#1b2b47',
  surfaceDeep: '#223556',
  cream: '#6d8fff',
  creamMuted: '#a9b7d0',
  creamSoft: 'rgba(148, 163, 184, 0.16)',
  creamStrong: 'rgba(96, 165, 250, 0.24)',
  accentText: '#0a1020',
  overlay: 'rgba(2, 6, 23, 0.55)',
  shadow: '#060b16',
  text: '#f8fbff',
  textMuted: '#aebbd3',
};

export const LIGHT_COLORS: AppColors = {
  background: '#f7f9ff',
  backgroundMuted: '#edf2ff',
  surface: '#ffffff',
  surfaceAlt: '#eef3ff',
  surfaceDeep: '#e1e9fb',
  cream: '#6c87f5',
  creamMuted: '#65708f',
  creamSoft: 'rgba(62, 82, 147, 0.12)',
  creamStrong: 'rgba(108, 135, 245, 0.16)',
  accentText: '#111827',
  overlay: 'rgba(17, 24, 39, 0.22)',
  shadow: '#1f2a44',
  text: '#111827',
  textMuted: '#5d667c',
};

export function getAppColors(themeMode: AppThemeMode): AppColors {
  return themeMode === 'light' ? LIGHT_COLORS : DARK_COLORS;
}

export const APP_COLORS = DARK_COLORS;

export const Colors = {
  light: {
    text: LIGHT_COLORS.text,
    background: LIGHT_COLORS.background,
    tint: LIGHT_COLORS.cream,
    icon: LIGHT_COLORS.textMuted,
    tabIconDefault: LIGHT_COLORS.textMuted,
    tabIconSelected: LIGHT_COLORS.cream,
  },
  dark: {
    text: DARK_COLORS.text,
    background: DARK_COLORS.background,
    tint: DARK_COLORS.cream,
    icon: DARK_COLORS.textMuted,
    tabIconDefault: DARK_COLORS.textMuted,
    tabIconSelected: DARK_COLORS.cream,
  },
} as const;
