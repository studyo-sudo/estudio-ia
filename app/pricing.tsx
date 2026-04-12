import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AppBottomNav from '../components/AppBottomNav';
import { BillingState, getBillingState } from '../services/billingStorage';
import {
  canUseNativePurchases,
  purchasePremiumPlan,
  restorePurchasesAndSyncPlan,
  syncPlanFromRevenueCat,
} from '../services/purchasesService';

export default function PricingScreen() {
  const [billing, setBilling] = useState<BillingState>({
    plan: 'free',
    credits: 0,
    creditGrants: [],
  });
  const [isLoading, setIsLoading] = useState(false);

  const nativePurchasesEnabled = canUseNativePurchases();

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

  const handleActivatePremium = async () => {
    try {
      setIsLoading(true);

      if (!nativePurchasesEnabled) {
        Alert.alert(
          'No disponible',
          'Las compras nativas no estan configuradas todavia para esta app.'
        );
        return;
      }

      await purchasePremiumPlan();
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

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Planes</Text>
        <Text style={styles.subtitle}>Elige como quieres usar Studyo Ai.</Text>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Estado de billing</Text>
          <Text style={styles.infoText}>
            {nativePurchasesEnabled
              ? `Compras nativas activas en ${Platform.OS}.`
              : 'Las compras nativas todavia no estan configuradas para esta plataforma.'}
          </Text>
        </View>

        <View style={[styles.planCard, billing.plan === 'free' && styles.activeCard]}>
          <Text style={styles.planName}>Free</Text>
          <Text style={styles.planPrice}>Gratis</Text>

          <Text style={styles.planFeature}>3 PDFs por semana</Text>
          <Text style={styles.planFeature}>3 imagenes por semana</Text>
          <Text style={styles.planFeature}>Flashcards limitadas</Text>
          <Text style={styles.planFeature}>Audio solo con creditos</Text>
          <Text style={styles.planFeature}>Creditos mas caros</Text>

          <View style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Plan base</Text>
          </View>
        </View>

        <View style={[styles.planCard, billing.plan === 'premium' && styles.activePremiumCard]}>
          <Text style={styles.planName}>Premium</Text>
          <Text style={styles.planPrice}>$20 / mes</Text>

          <Text style={styles.planFeature}>300 a 500 PDFs</Text>
          <Text style={styles.planFeature}>1000 imagenes</Text>
          <Text style={styles.planFeature}>20 a 25 horas de audio</Text>
          <Text style={styles.planFeature}>Sin anuncios</Text>
          <Text style={styles.planFeature}>Creditos mas baratos</Text>
          <Text style={styles.planFeature}>Uso justo incluido</Text>

          <Pressable
            style={styles.primaryButton}
            onPress={handleActivatePremium}
            disabled={isLoading}
          >
            <Text style={styles.primaryButtonText}>
              {billing.plan === 'premium'
                ? 'Premium activo'
                : isLoading
                ? 'Procesando...'
                : 'Comprar Premium'}
            </Text>
          </Pressable>

          {nativePurchasesEnabled ? (
            <Pressable style={styles.restoreButton} onPress={handleRestore} disabled={isLoading}>
              <Text style={styles.restoreButtonText}>Restaurar compras</Text>
            </Pressable>
          ) : null}
        </View>

        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Volver</Text>
        </Pressable>
      </ScrollView>

      <AppBottomNav activeTab="shop" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 120,
  },
  title: {
    color: 'white',
    fontSize: 34,
    fontWeight: '800',
    marginBottom: 10,
  },
  subtitle: {
    color: '#cbd5e1',
    fontSize: 17,
    lineHeight: 24,
    marginBottom: 24,
  },
  infoCard: {
    backgroundColor: '#111827',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
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
  },
  planCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  activeCard: {
    borderWidth: 2,
    borderColor: '#22c55e',
  },
  activePremiumCard: {
    borderWidth: 2,
    borderColor: '#60a5fa',
  },
  planName: {
    color: 'white',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  planPrice: {
    color: '#93c5fd',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 14,
  },
  planFeature: {
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
    marginTop: 16,
  },
  secondaryButtonText: {
    color: '#cbd5e1',
    fontWeight: '700',
    fontSize: 16,
  },
  restoreButton: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  restoreButtonText: {
    color: '#cbd5e1',
    fontWeight: '700',
    fontSize: 16,
  },
  backButton: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  backButtonText: {
    color: '#cbd5e1',
    fontWeight: '700',
    fontSize: 16,
  },
});
