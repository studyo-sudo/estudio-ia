import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AppBottomNav from '../components/AppBottomNav';
import { useAppPreferences } from '../contexts/AppPreferencesContext';
import { getHistoryItems, HistoryItem } from '../services/historyStorage';

function getFlashcardsBadge() {
  return { icon: 'albums-outline' as const, color: '#7dd3fc' };
}

export default function FlashcardsHistoryScreen() {
  const { colors, t, locale } = useAppPreferences();
  const [items, setItems] = useState<HistoryItem[]>([]);

  const styles = useMemo(() => createStyles(colors), [colors]);

  const loadItems = useCallback(async () => {
    const history = await getHistoryItems();

    const flashcardItems = history.filter(
      (item) =>
        item.payload.kind === 'study-result' &&
        Array.isArray(item.payload.result.flashcards) &&
        item.payload.result.flashcards.length > 0
    );

    setItems(flashcardItems);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadItems();
    }, [loadItems])
  );

  const openFlashcards = (item: HistoryItem) => {
    if (item.payload.kind !== 'study-result') return;

    router.push({
      pathname: '/flashcards',
      params: {
        cards: JSON.stringify(item.payload.result.flashcards),
      },
    });
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{t('flashcardsHistory.title')}</Text>
        <Text style={styles.subtitle}>{t('flashcardsHistory.subtitle')}</Text>

        {items.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>{t('flashcardsHistory.emptyTitle')}</Text>
            <Text style={styles.emptyText}>{t('flashcardsHistory.emptyText')}</Text>
          </View>
        ) : (
          items.map((item) => {
            if (item.payload.kind !== 'study-result') return null;
            const badge = getFlashcardsBadge();

            return (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <View style={styles.itemHeaderText}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.itemMeta}>
                      {new Date(item.createdAt).toLocaleString(locale)}
                    </Text>
                  </View>

                  <View style={styles.itemBadge}>
                    <Ionicons name={badge.icon} size={18} color={badge.color} />
                  </View>
                </View>

                <Text style={styles.itemCount}>
                  {t('flashcardsHistory.cardsCount', {
                    count: item.payload.result.flashcards.length,
                  })}
                </Text>

                <Pressable style={styles.openButton} onPress={() => openFlashcards(item)}>
                  <Text style={styles.openButtonText}>{t('flashcardsHistory.study')}</Text>
                </Pressable>
              </View>
            );
          })
        )}

        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>{t('common.back')}</Text>
        </Pressable>
      </ScrollView>

      <AppBottomNav activeTab="history" />
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useAppPreferences>['colors']) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 24,
      paddingBottom: 160,
    },
    title: {
      color: colors.text,
      fontSize: 34,
      fontWeight: '800',
      marginBottom: 10,
      textAlign: 'center',
      width: '100%',
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: 17,
      lineHeight: 24,
      marginBottom: 24,
      textAlign: 'center',
      width: '100%',
    },
    emptyCard: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.creamSoft,
    },
    emptyTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '700',
      marginBottom: 10,
    },
    emptyText: {
      color: colors.textMuted,
      fontSize: 15,
      lineHeight: 24,
    },
    itemCard: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 18,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: colors.creamSoft,
    },
    itemHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12,
      marginBottom: 12,
    },
    itemHeaderText: {
      flex: 1,
    },
    itemTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 6,
    },
    itemMeta: {
      color: colors.textMuted,
      fontSize: 13,
      marginBottom: 8,
    },
    itemBadge: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.creamSoft,
    },
    itemCount: {
      color: colors.textMuted,
      fontSize: 15,
      marginBottom: 14,
    },
    openButton: {
      backgroundColor: colors.cream,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: 'center',
    },
    openButtonText: {
      color: colors.accentText,
      fontWeight: '700',
    },
    backButton: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 8,
      borderWidth: 1,
      borderColor: colors.creamSoft,
    },
    backButtonText: {
      color: colors.text,
      fontWeight: '700',
      fontSize: 16,
    },
  });
}
