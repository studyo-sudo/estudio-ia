import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import AppBottomNav from '../components/AppBottomNav';
import { useAppPreferences } from '../contexts/AppPreferencesContext';
import { useSyncedBilling } from '../hooks/useSyncedBilling';

type Flashcard = {
  front: string;
  back: string;
};

export default function FlashcardsScreen() {
  const { colors, t } = useAppPreferences();
  const params = useLocalSearchParams<{ cards?: string }>();
  const { width, height } = useWindowDimensions();

  const styles = useMemo(() => createStyles(colors), [colors]);

  const { billing, refreshBilling } = useSyncedBilling();

  useFocusEffect(
    useCallback(() => {
      void refreshBilling();
    }, [refreshBilling])
  );

  const cards: Flashcard[] = useMemo(() => {
    try {
      if (!params.cards || typeof params.cards !== 'string') return [];
      const parsed = JSON.parse(params.cards);

      if (!Array.isArray(parsed)) return [];

      const validCards = parsed.filter(
        (card) => card && typeof card.front === 'string' && typeof card.back === 'string'
      );

      return billing.plan === 'free' ? validCards.slice(0, 5) : validCards;
    } catch {
      return [];
    }
  }, [params.cards, billing.plan]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const flipAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(flipAnim, {
      toValue: isFlipped ? 180 : 0,
      useNativeDriver: true,
      friction: 8,
      tension: 10,
    }).start();
  }, [flipAnim, isFlipped]);

  const handleFlip = () => {
    setIsFlipped((prev) => !prev);
  };

  const handleNext = () => {
    if (cards.length === 0) return;

    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % cards.length);
    flipAnim.setValue(0);
  };

  const handleBack = () => {
    router.back();
  };

  if (cards.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>{t('flashcards.noCards')}</Text>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>{t('flashcards.back')}</Text>
        </Pressable>
      </View>
    );
  }

  const currentCard = cards[currentIndex];
  const currentColor = CARD_COLORS[currentIndex % CARD_COLORS.length];
  const isLightCard = currentColor === colors.cream;
  const cardWidth = Math.min(width * 0.82, 700);
  const cardHeight = Math.min(height * 0.52, 360);

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  return (
    <View style={styles.screen}>
      <Text style={styles.counter}>
        Card {currentIndex + 1} / {cards.length}
      </Text>

      {billing.plan === 'free' ? (
        <Text style={styles.freeNotice}>{t('flashcards.freeNotice')}</Text>
      ) : null}

      <Pressable onPress={handleFlip} style={styles.cardPressable}>
        <View style={[styles.cardWrapper, { width: cardWidth, height: cardHeight }]}>
          <Animated.View
            style={[
              styles.card,
              isLightCard && styles.cardLight,
              {
                backgroundColor: currentColor,
                transform: [{ rotateY: frontInterpolate }],
              },
            ]}
          >
            <Text style={[styles.cardLabel, isLightCard && styles.cardLabelLight]}>
              {t('flashcards.question')}
            </Text>
            <Text style={[styles.cardText, isLightCard && styles.cardTextLight]}>
              {currentCard.front}
            </Text>
            <Text style={[styles.cardHint, isLightCard && styles.cardHintLight]}>
              {t('flashcards.tapFront')}
            </Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.card,
              isLightCard && styles.cardLight,
              {
                backgroundColor: currentColor,
                transform: [{ rotateY: backInterpolate }],
              },
            ]}
          >
            <Text style={[styles.cardLabel, isLightCard && styles.cardLabelLight]}>
              {t('flashcards.answer')}
            </Text>
            <Text style={[styles.cardText, isLightCard && styles.cardTextLight]}>
              {currentCard.back}
            </Text>
            <Text style={[styles.cardHint, isLightCard && styles.cardHintLight]}>
              {t('flashcards.tapBack')}
            </Text>
          </Animated.View>
        </View>
      </Pressable>

      <View style={styles.buttonsRow}>
        <Pressable style={styles.navButtonSecondary} onPress={handleBack}>
          <Text style={styles.navButtonSecondaryText}>{t('flashcards.back')}</Text>
        </Pressable>

        <Pressable style={styles.navButtonPrimary} onPress={handleNext}>
          <Text style={styles.navButtonPrimaryText}>{t('flashcards.next')}</Text>
        </Pressable>
      </View>

      <AppBottomNav activeTab="home" />
    </View>
  );
}

const CARD_COLORS = [
  '#16233b',
  '#1b2b47',
  '#223556',
  '#6d8fff',
];

function createStyles(colors: ReturnType<typeof useAppPreferences>['colors']) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 20,
      paddingTop: 30,
      paddingBottom: 160,
    },
    counter: {
      color: colors.textMuted,
      fontSize: 16,
      marginBottom: 14,
      fontWeight: '600',
    },
    freeNotice: {
      color: colors.textMuted,
      fontSize: 13,
      marginBottom: 14,
      textAlign: 'center',
    },
    cardPressable: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardWrapper: {
      position: 'relative',
    },
    card: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      borderRadius: 26,
      padding: 26,
      alignItems: 'center',
      justifyContent: 'center',
      backfaceVisibility: 'hidden',
      shadowColor: colors.shadow,
      shadowOpacity: 0.25,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
      elevation: 10,
    },
    cardLabel: {
      color: colors.textMuted,
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 18,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    cardText: {
      color: colors.text,
      fontSize: 28,
      lineHeight: 38,
      fontWeight: '800',
      textAlign: 'center',
      marginBottom: 20,
    },
    cardHint: {
      color: colors.textMuted,
      fontSize: 14,
      textAlign: 'center',
    },
    cardLight: {
      borderWidth: 1,
      borderColor: colors.creamSoft,
    },
    cardLabelLight: {
      color: colors.accentText,
    },
    cardTextLight: {
      color: colors.accentText,
    },
    cardHintLight: {
      color: colors.accentText,
    },
    buttonsRow: {
      flexDirection: 'row',
      gap: 14,
      marginTop: 34,
    },
    navButtonPrimary: {
      backgroundColor: colors.cream,
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 28,
      minWidth: 120,
      alignItems: 'center',
    },
    navButtonPrimaryText: {
      color: colors.accentText,
      fontSize: 16,
      fontWeight: '700',
    },
    navButtonSecondary: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 28,
      minWidth: 120,
      alignItems: 'center',
    },
    navButtonSecondaryText: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '700',
    },
    emptyContainer: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    emptyTitle: {
      color: colors.text,
      fontSize: 24,
      fontWeight: '700',
      marginBottom: 20,
    },
    backButton: {
      backgroundColor: colors.cream,
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 28,
    },
    backButtonText: {
      color: colors.accentText,
      fontSize: 16,
      fontWeight: '700',
    },
  });
}
