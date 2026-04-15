import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { APP_COLORS } from '../constants/theme';

type AppBottomNavProps = {
  activeTab?: 'home' | 'history' | 'shop' | 'account';
};

type NavItem = {
  key: NonNullable<AppBottomNavProps['activeTab']>;
  label: string;
  activeIcon: keyof typeof Ionicons.glyphMap;
  inactiveIcon: keyof typeof Ionicons.glyphMap;
  href: '/(tabs)' | '/(tabs)/explore' | '/(tabs)/shop' | '/(tabs)/account';
};

const NAV_ITEMS: NavItem[] = [
  { key: 'home', label: 'Inicio', activeIcon: 'home', inactiveIcon: 'home-outline', href: '/(tabs)' },
  { key: 'history', label: 'Historial', activeIcon: 'time', inactiveIcon: 'time-outline', href: '/(tabs)/explore' },
  { key: 'shop', label: 'Tienda', activeIcon: 'cart', inactiveIcon: 'cart-outline', href: '/(tabs)/shop' },
  { key: 'account', label: 'Cuenta', activeIcon: 'person', inactiveIcon: 'person-outline', href: '/(tabs)/account' },
];

export default function AppBottomNav({ activeTab }: AppBottomNavProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
        {NAV_ITEMS.map((item) => {
          const focused = item.key === activeTab;

          return (
            <Pressable key={item.key} style={styles.item} onPress={() => router.replace(item.href)}>
              <Ionicons
                name={focused ? item.activeIcon : item.inactiveIcon}
                size={24}
                color={focused ? APP_COLORS.cream : APP_COLORS.creamMuted}
              />
              <Text style={[styles.label, focused && styles.labelActive]}>{item.label}</Text>
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
    bottom: 0,
    alignItems: 'center',
  },
  bar: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: APP_COLORS.background,
    borderTopWidth: 1,
    borderTopColor: APP_COLORS.creamSoft,
    paddingTop: 10,
    paddingHorizontal: 8,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  label: {
    color: APP_COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  labelActive: {
    color: APP_COLORS.text,
  },
});
