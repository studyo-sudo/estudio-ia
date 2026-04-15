import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import CreditCostTable from '../components/CreditCostTable';
import AppBottomNav from '../components/AppBottomNav';
import {
  purchasePremiumPlan,
  restorePurchasesAndSyncPlan,
} from '../services/purchasesService';
import { useSyncedBilling } from '../hooks/useSyncedBilling';
import { APP_COLORS } from '../constants/theme';

export default function PricingScreen() {
  const [isLoading, setIsLoading] = useState(false);

  const { billing, refreshBilling, nativePurchasesEnabled } = useSyncedBilling();

  useFocusEffect(
    useCallback(() => {
      void refreshBilling();
    }, [refreshBilling])
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
      await refreshBilling();
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
      await refreshBilling();
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

        <CreditCostTable />

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
    backgroundColor: APP_COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
  },
    content: {
      paddingHorizontal: 20,
      paddingTop: 24,
      paddingBottom: 280,
    },
  title: {
    color: APP_COLORS.text,
    fontSize: 34,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
    width: '100%',
  },
  subtitle: {
    color: APP_COLORS.textMuted,
    fontSize: 17,
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center',
    width: '100%',
  },
  infoCard: {
    backgroundColor: APP_COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: APP_COLORS.creamSoft,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  infoTitle: {
    color: APP_COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  infoText: {
    color: APP_COLORS.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
  planCard: {
    backgroundColor: APP_COLORS.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: APP_COLORS.creamSoft,
  },
  activeCard: {
    borderWidth: 2,
    borderColor: APP_COLORS.text,
  },
  activePremiumCard: {
    borderWidth: 2,
    borderColor: APP_COLORS.text,
  },
  planName: {
    color: APP_COLORS.text,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  planPrice: {
    color: APP_COLORS.text,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 14,
  },
  planFeature: {
    color: APP_COLORS.textMuted,
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 4,
  },
  primaryButton: {
    backgroundColor: APP_COLORS.text,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  primaryButtonText: {
    color: APP_COLORS.accentText,
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: APP_COLORS.background,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 1,
    borderColor: APP_COLORS.creamSoft,
  },
  secondaryButtonText: {
    color: APP_COLORS.text,
    fontWeight: '700',
    fontSize: 16,
  },
  restoreButton: {
    backgroundColor: APP_COLORS.background,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: APP_COLORS.creamSoft,
  },
  restoreButtonText: {
    color: APP_COLORS.text,
    fontWeight: '700',
    fontSize: 16,
  },
  backButton: {
    backgroundColor: APP_COLORS.surface,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
    borderWidth: 1,
    borderColor: APP_COLORS.creamSoft,
  },
  backButtonText: {
    color: APP_COLORS.text,
    fontWeight: '700',
    fontSize: 16,
  },
});
