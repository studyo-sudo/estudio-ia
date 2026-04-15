export const APP_COLORS = {
  background: '#fbf7f1',
  backgroundMuted: '#f4eee7',
  surface: '#e8e0f2',
  surfaceAlt: '#dfeaf6',
  surfaceDeep: '#f2dfe6',
  cream: '#f6d5c3',
  creamMuted: '#a8a1b7',
  creamSoft: 'rgba(63, 77, 107, 0.12)',
  creamStrong: 'rgba(63, 77, 107, 0.2)',
  accentText: '#fff7f0',
  overlay: 'rgba(63, 77, 107, 0.16)',
  shadow: '#c8bfd3',
  text: '#6b7591',
  textMuted: '#8c94a8',
} as const;

export const Colors = {
  light: {
    text: APP_COLORS.text,
    background: APP_COLORS.background,
    tint: APP_COLORS.accentText,
    icon: APP_COLORS.textMuted,
    tabIconDefault: APP_COLORS.textMuted,
    tabIconSelected: APP_COLORS.accentText,
  },
  dark: {
    text: APP_COLORS.text,
    background: APP_COLORS.background,
    tint: APP_COLORS.accentText,
    icon: APP_COLORS.textMuted,
    tabIconDefault: APP_COLORS.textMuted,
    tabIconSelected: APP_COLORS.accentText,
  },
} as const;
