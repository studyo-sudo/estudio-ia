import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppPreferences } from '../contexts/AppPreferencesContext';

type AppBottomNavProps = {
  activeTab?: 'home' | 'history' | 'calendar' | 'shop' | 'account';
};

type NavItem = {
  key: NonNullable<AppBottomNavProps['activeTab']>;
  label: string;
  activeIcon: keyof typeof Ionicons.glyphMap;
  inactiveIcon: keyof typeof Ionicons.glyphMap;
  href: '/(tabs)' | '/(tabs)/explore' | '/(tabs)/calendar' | '/(tabs)/shop' | '/(tabs)/account';
};

const NAV_ITEMS: NavItem[] = [
  { key: 'home', label: 'nav.home', activeIcon: 'home', inactiveIcon: 'home-outline', href: '/(tabs)' },
  { key: 'history', label: 'nav.history', activeIcon: 'time', inactiveIcon: 'time-outline', href: '/(tabs)/explore' },
  {
    key: 'calendar',
    label: 'nav.calendar',
    activeIcon: 'calendar',
    inactiveIcon: 'calendar-outline',
    href: '/(tabs)/calendar',
  },
  { key: 'shop', label: 'nav.shop', activeIcon: 'cart', inactiveIcon: 'cart-outline', href: '/(tabs)/shop' },
  { key: 'account', label: 'nav.account', activeIcon: 'person', inactiveIcon: 'person-outline', href: '/(tabs)/account' },
];

export default function AppBottomNav({ activeTab }: AppBottomNavProps) {
  const insets = useSafeAreaInsets();
  const { colors, t } = useAppPreferences();
  const bottomPadding = Math.max(insets.bottom, 4);

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <View
        style={[
          styles.bar,
          {
            paddingBottom: bottomPadding,
            backgroundColor: colors.background,
            borderTopColor: colors.creamSoft,
          },
        ]}
      >
        {NAV_ITEMS.map((item) => {
          const focused = item.key === activeTab;
          const iconColor = focused ? colors.cream : colors.textMuted;

          return (
            <Pressable
              key={item.key}
              style={styles.item}
              onPress={() => router.replace(item.href as never)}
            >
              <Ionicons
                name={focused ? item.activeIcon : item.inactiveIcon}
                size={24}
                color={iconColor}
              />
              <Text style={[styles.label, focused && styles.labelActive, { color: iconColor }]}>
                {t(item.label)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 8,
    alignItems: 'center',
  },
  bar: {
    flexDirection: 'row',
    width: '100%',
    borderTopWidth: 1,
    paddingTop: 12,
    paddingHorizontal: 8,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
  labelActive: {
  },
});
