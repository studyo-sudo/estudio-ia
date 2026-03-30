import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BillingState, getBillingState, setPlan } from '../services/billingStorage';

export default function PricingScreen() {
  const [billing, setBilling] = useState<BillingState>({
    plan: 'free',
    credits: 0,
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

  const handleActivatePremium = async () => {
    await setPlan('premium');
    await loadBilling();
  };

  const handleActivateFree = async () => {
    await setPlan('free');
    await loadBilling();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Planes</Text>
      <Text style={styles.subtitle}>
        Elegí cómo querés usar Estudio IA.
      </Text>

      <View style={[styles.planCard, billing.plan === 'free' && styles.activeCard]}>
        <Text style={styles.planName}>🟢 Free</Text>
        <Text style={styles.planPrice}>Gratis</Text>

        <Text style={styles.planFeature}>• 3 PDFs por semana</Text>
        <Text style={styles.planFeature}>• 3 imágenes por semana</Text>
        <Text style={styles.planFeature}>• Flashcards limitadas</Text>
        <Text style={styles.planFeature}>• Audio solo con créditos</Text>
        <Text style={styles.planFeature}>• Anuncio antes de cada uso</Text>
        <Text style={styles.planFeature}>• Créditos más caros</Text>

        <Pressable style={styles.secondaryButton} onPress={handleActivateFree}>
          <Text style={styles.secondaryButtonText}>
            {billing.plan === 'free' ? 'Plan actual' : 'Usar Free'}
          </Text>
        </Pressable>
      </View>

      <View
        style={[
          styles.planCard,
          billing.plan === 'premium' && styles.activePremiumCard,
        ]}
      >
        <Text style={styles.planName}>💎 Premium</Text>
        <Text style={styles.planPrice}>$10 / mes</Text>

        <Text style={styles.planFeature}>• 300–500 PDFs</Text>
        <Text style={styles.planFeature}>• 1000 imágenes</Text>
        <Text style={styles.planFeature}>• 20–25 horas de audio</Text>
        <Text style={styles.planFeature}>• Sin anuncios</Text>
        <Text style={styles.planFeature}>• Créditos más baratos</Text>
        <Text style={styles.planFeature}>• Uso justo incluido</Text>

        <Pressable style={styles.primaryButton} onPress={handleActivatePremium}>
          <Text style={styles.primaryButtonText}>
            {billing.plan === 'premium' ? 'Premium activo' : 'Activar Premium'}
          </Text>
        </Pressable>
      </View>

      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>Volver</Text>
      </Pressable>
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