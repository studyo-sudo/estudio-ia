import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import AppBottomNav from '../components/AppBottomNav';
import { BillingState, getBillingState } from '../services/billingStorage';

type Flashcard = {
  front: string;
  back: string;
};

const CARD_COLORS = ['#2563eb', '#7c3aed', '#0891b2', '#059669', '#ea580c', '#db2777'];

export default function FlashcardsScreen() {
  const params = useLocalSearchParams<{ cards?: string }>();
  const { width, height } = useWindowDimensions();

  const [billing, setBilling] = useState<BillingState>({
    plan: 'free',
    credits: 0,
    creditGrants: [],
  });

  const loadBilling = useCallback(async () => {
    const state = await getBillingState();
    setBilling(state);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadBilling();
    }, [loadBilling])
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
        <Text style={styles.emptyTitle}>No hay flashcards</Text>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  const currentCard = cards[currentIndex];
  const currentColor = CARD_COLORS[currentIndex % CARD_COLORS.length];
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
        <Text style={styles.freeNotice}>
          En Free se muestran hasta 5 flashcards por sesion.
        </Text>
      ) : null}

      <Pressable onPress={handleFlip} style={styles.cardPressable}>
        <View style={[styles.cardWrapper, { width: cardWidth, height: cardHeight }]}>
          <Animated.View
            style={[
              styles.card,
              {
                backgroundColor: currentColor,
                transform: [{ rotateY: frontInterpolate }],
              },
            ]}
          >
            <Text style={styles.cardLabel}>Pregunta</Text>
            <Text style={styles.cardText}>{currentCard.front}</Text>
            <Text style={styles.cardHint}>Toca la card para ver la respuesta</Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.card,
              {
                backgroundColor: currentColor,
                transform: [{ rotateY: backInterpolate }],
              },
            ]}
          >
            <Text style={styles.cardLabel}>Respuesta</Text>
            <Text style={styles.cardText}>{currentCard.back}</Text>
            <Text style={styles.cardHint}>Toca la card para volver</Text>
          </Animated.View>
        </View>
      </Pressable>

      <View style={styles.buttonsRow}>
        <Pressable style={styles.navButtonSecondary} onPress={handleBack}>
          <Text style={styles.navButtonSecondaryText}>Volver</Text>
        </Pressable>

        <Pressable style={styles.navButtonPrimary} onPress={handleNext}>
          <Text style={styles.navButtonPrimaryText}>Siguiente</Text>
        </Pressable>
      </View>

      <AppBottomNav activeTab="home" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 110,
  },
  counter: {
    color: '#cbd5e1',
    fontSize: 16,
    marginBottom: 14,
    fontWeight: '600',
  },
  freeNotice: {
    color: '#94a3b8',
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
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  cardLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 18,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardText: {
    color: 'white',
    fontSize: 28,
    lineHeight: 38,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 20,
  },
  cardHint: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    textAlign: 'center',
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 34,
  },
  navButtonPrimary: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
    minWidth: 120,
    alignItems: 'center',
  },
  navButtonPrimaryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  navButtonSecondary: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
    minWidth: 120,
    alignItems: 'center',
  },
  navButtonSecondaryText: {
    color: '#cbd5e1',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});
