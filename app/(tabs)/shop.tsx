import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { ENABLE_FAKE_BILLING } from '../../constants/env';
import { addCredits, BillingState, getBillingState } from '../../services/billingStorage';
import {
  canUseNativePurchases,
  purchasePremiumPlan,
  restorePurchasesAndSyncPlan,
  syncPlanFromRevenueCat,
} from '../../services/purchasesService';

type CreditPack = {
  title: string;
  credits: number;
  price: string;
  equivalents: string[];
};

const CREDIT_PACKS: CreditPack[] = [
  {
    title: 'Pack basico',
    credits: 50,
    price: '$10',
    equivalents: ['50 PDFs', '200 imagenes', '1 hora de audio'],
  },
  {
    title: 'Pack mediano',
    credits: 120,
    price: '$20',
    equivalents: ['120 PDFs', '500 imagenes', '2.5 horas de audio'],
  },
  {
    title: 'Pack grande',
    credits: 300,
    price: '$40',
    equivalents: ['300 PDFs', '1200 imagenes', '7 horas de audio'],
  },
];

function formatDate(dateValue: number) {
  return new Date(dateValue).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function ShopScreen() {
  const { width } = useWindowDimensions();
  const [billing, setBilling] = useState<BillingState>({
    plan: 'free',
    credits: 0,
    creditGrants: [],
  });
  const [isLoading, setIsLoading] = useState(false);

  const nativePurchasesEnabled = canUseNativePurchases();
  const billingMode = nativePurchasesEnabled
    ? 'native'
    : ENABLE_FAKE_BILLING
    ? 'demo'
    : 'manual';

  const loadBilling = useCallback(async () => {
    if (nativePurchasesEnabled) {
      await syncPlanFromRevenueCat().catch(() => {});
    }

    const state = await getBillingState();
    setBilling(state);
  }, [nativePurchasesEnabled]);

  useFocusEffect(
    useCallback(() => {
      void loadBilling();
    }, [loadBilling])
  );

  const nextExpiration = useMemo(() => {
    if (billing.creditGrants.length === 0) {
      return null;
    }

    return billing.creditGrants.reduce((earliest, grant) =>
      grant.expiresAt < earliest.expiresAt ? grant : earliest
    );
  }, [billing.creditGrants]);

  const cardWidth = Math.min(width - 72, 300);
  const cardGap = 14;
  const initialCarouselOffset = cardWidth + cardGap;

  const handleActivatePremium = async () => {
    try {
      setIsLoading(true);

      if (nativePurchasesEnabled) {
        await purchasePremiumPlan();
      } else {
        Alert.alert(
          'No disponible',
          'Las compras nativas no estan configuradas todavia para esta app.'
        );
      }

      await loadBilling();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo activar Premium.';
      Alert.alert('Compra no completada', message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async () => {
    try {
      setIsLoading(true);
      await restorePurchasesAndSyncPlan();
      await loadBilling();
      Alert.alert('Restauracion completa', 'Se restauraron tus compras correctamente.');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No se pudieron restaurar las compras.';
      Alert.alert('Error restaurando compras', message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuyPack = async (credits: number) => {
    if (!ENABLE_FAKE_BILLING) {
      Alert.alert(
        'No disponible',
        'La compra real de creditos todavia necesita integracion con backend o tienda.'
      );
      return;
    }

    await addCredits(credits);
    await loadBilling();
    Alert.alert(
      'Compra registrada',
      `Se agregaron ${credits} creditos. Recuerda que vencen a los 30 dias.`
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Tienda</Text>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Saldo actual</Text>
        <Text style={styles.balanceValue}>{billing.credits} creditos</Text>
        <Text style={styles.balancePlan}>
          {billing.plan === 'premium' ? 'Plan Premium activo' : 'Plan Free'}
        </Text>
        {nextExpiration ? (
          <Text style={styles.expirationText}>
            Proximo vencimiento de creditos: {formatDate(nextExpiration.expiresAt)}
          </Text>
        ) : (
          <Text style={styles.expirationText}>Todavia no tienes creditos activos.</Text>
        )}
      </View>

      <View
        style={[
          styles.premiumCard,
          billing.plan === 'premium' && styles.premiumCardActive,
        ]}
      >
        <Text style={styles.sectionTitle}>Premium</Text>
        <Text style={styles.premiumPrice}>$20 / mes</Text>
        <Text style={styles.premiumFeature}>Sin anuncios</Text>
        <Text style={styles.premiumFeature}>Sin limites semanales molestos</Text>
        <Text style={styles.premiumFeature}>Mejor experiencia de estudio</Text>

        <Pressable style={styles.primaryButton} onPress={handleActivatePremium} disabled={isLoading}>
          <Text style={styles.primaryButtonText}>
            {billing.plan === 'premium'
              ? 'Premium activo'
              : isLoading
              ? 'Procesando...'
              : 'Comprar Premium'}
          </Text>
        </Pressable>

        {nativePurchasesEnabled ? (
          <Pressable style={styles.secondaryButton} onPress={handleRestore} disabled={isLoading}>
            <Text style={styles.secondaryButtonText}>Restaurar compras</Text>
          </Pressable>
        ) : null}
      </View>

      <Text style={styles.sectionTitle}>Packs de creditos</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={cardWidth + cardGap}
        snapToAlignment="start"
        contentOffset={{ x: initialCarouselOffset, y: 0 }}
        contentContainerStyle={styles.packList}
      >
        {CREDIT_PACKS.map((pack) => (
          <View key={pack.title} style={[styles.packCard, { width: cardWidth }]}>
            <Text style={styles.packTitle}>{pack.title}</Text>
            <Text style={styles.packCredits}>{pack.credits} creditos</Text>
            <Text style={styles.packPrice}>{pack.price}</Text>
            <Text style={styles.packHint}>Equivale aprox. a:</Text>
            {pack.equivalents.map((item) => (
              <Text key={item} style={styles.packEquivalent}>
                - {item}
              </Text>
            ))}

            <Pressable
              style={styles.buyButton}
              onPress={() => {
                void handleBuyPack(pack.credits);
              }}
            >
              <Text style={styles.buyButtonText}>
                {ENABLE_FAKE_BILLING ? 'Comprar pack' : 'Proximamente'}
              </Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Importante</Text>
        <Text style={styles.infoText}>
          Los creditos duran 30 dias desde la compra. Despues de ese plazo se vencen.
        </Text>
        <Text style={styles.infoText}>
          {billingMode === 'native'
            ? `Compras nativas activas en ${Platform.OS}.`
            : billingMode === 'demo'
            ? 'Los creditos se agregan en modo demo para pruebas.'
            : 'La compra real de creditos todavia no esta conectada en esta build.'}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 140,
  },
  title: {
    color: 'white',
    fontSize: 34,
    fontWeight: '800',
    marginBottom: 10,
  },
  balanceCard: {
    backgroundColor: '#1e293b',
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
  },
  balanceLabel: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 8,
  },
  balanceValue: {
    color: '#93c5fd',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 6,
  },
  balancePlan: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  expirationText: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 22,
  },
  infoCard: {
    backgroundColor: '#111827',
    borderRadius: 18,
    padding: 18,
    marginTop: 18,
  },
  infoTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  infoText: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 4,
  },
  premiumCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
    marginBottom: 18,
  },
  premiumCardActive: {
    borderWidth: 2,
    borderColor: '#60a5fa',
  },
  sectionTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 12,
  },
  premiumPrice: {
    color: '#93c5fd',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 14,
  },
  premiumFeature: {
    color: '#e2e8f0',
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 4,
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  secondaryButtonText: {
    color: '#cbd5e1',
    fontWeight: '700',
    fontSize: 16,
  },
  packList: {
    gap: 14,
    paddingRight: 20,
  },
  packCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
  },
  packTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  packCredits: {
    color: '#cbd5e1',
    fontSize: 18,
    marginBottom: 6,
  },
  packPrice: {
    color: '#93c5fd',
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 14,
  },
  packHint: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  packEquivalent: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 4,
  },
  buyButton: {
    backgroundColor: '#7c3aed',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  buyButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
});
