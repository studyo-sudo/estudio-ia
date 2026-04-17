import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AppBottomNav from '../components/AppBottomNav';
import CreditCostTable from '../components/CreditCostTable';
import { useAppPreferences } from '../contexts/AppPreferencesContext';
import {
  purchasePremiumPlan,
  restorePurchasesAndSyncPlan,
} from '../services/purchasesService';
import { useSyncedBilling } from '../hooks/useSyncedBilling';

export default function PricingScreen() {
  const { colors, t } = useAppPreferences();
  const [isLoading, setIsLoading] = useState(false);

  const styles = useMemo(() => createStyles(colors), [colors]);

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
          'Las compras nativas no están configuradas todavía para esta app.'
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
      Alert.alert('Restauración completa', 'Se restauraron tus compras correctamente.');
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
        <Text style={styles.title}>{t('pricing.title')}</Text>
        <Text style={styles.subtitle}>{t('pricing.subtitle')}</Text>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>{t('pricing.billingTitle')}</Text>
          <Text style={styles.infoText}>
            {nativePurchasesEnabled
              ? `Compras nativas activas en ${Platform.OS}.`
              : 'Las compras nativas todavía no están configuradas para esta plataforma.'}
          </Text>
        </View>

        <CreditCostTable />

        <View style={[styles.planCard, billing.plan === 'free' && styles.activeCard]}>
          <Text style={styles.planName}>{t('pricing.freeTitle')}</Text>
          <Text style={styles.planPrice}>{t('pricing.freePrice')}</Text>

          <Text style={styles.planFeature}>{t('pricing.freeFeature1')}</Text>
          <Text style={styles.planFeature}>{t('pricing.freeFeature2')}</Text>
          <Text style={styles.planFeature}>{t('pricing.freeFeature3')}</Text>
          <Text style={styles.planFeature}>{t('pricing.freeFeature4')}</Text>
          <Text style={styles.planFeature}>{t('pricing.freeFeature5')}</Text>

          <View style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>{t('pricing.basePlan')}</Text>
          </View>
        </View>

        <View style={[styles.planCard, billing.plan === 'premium' && styles.activePremiumCard]}>
          <Text style={styles.planName}>{t('pricing.premiumTitle')}</Text>
          <Text style={styles.planPrice}>{t('pricing.premiumPrice')}</Text>

          <Text style={styles.planFeature}>{t('pricing.premiumFeature1')}</Text>
          <Text style={styles.planFeature}>{t('pricing.premiumFeature2')}</Text>
          <Text style={styles.planFeature}>{t('pricing.premiumFeature3')}</Text>
          <Text style={styles.planFeature}>{t('pricing.premiumFeature4')}</Text>
          <Text style={styles.planFeature}>{t('pricing.premiumFeature5')}</Text>
          <Text style={styles.planFeature}>{t('pricing.premiumFeature6')}</Text>

          <Pressable
            style={styles.primaryButton}
            onPress={handleActivatePremium}
            disabled={isLoading}
          >
            <Text style={styles.primaryButtonText}>
              {billing.plan === 'premium'
                ? t('pricing.premiumActive')
                : isLoading
                ? t('common.loading')
                : t('pricing.buyPremium')}
            </Text>
          </Pressable>

          {nativePurchasesEnabled ? (
            <Pressable style={styles.restoreButton} onPress={handleRestore} disabled={isLoading}>
              <Text style={styles.restoreButtonText}>{t('pricing.restorePurchases')}</Text>
            </Pressable>
          ) : null}
        </View>

        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>{t('pricing.back')}</Text>
        </Pressable>
      </ScrollView>

      <AppBottomNav activeTab="shop" />
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
    infoCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.creamSoft,
      padding: 20,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOpacity: 0.16,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
      elevation: 4,
    },
    infoTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 8,
    },
    infoText: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 22,
    },
    planCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.creamSoft,
    },
    activeCard: {
      borderWidth: 2,
      borderColor: colors.text,
    },
    activePremiumCard: {
      borderWidth: 2,
      borderColor: colors.text,
    },
    planName: {
      color: colors.text,
      fontSize: 24,
      fontWeight: '800',
      marginBottom: 8,
    },
    planPrice: {
      color: colors.text,
      fontSize: 22,
      fontWeight: '700',
      marginBottom: 14,
    },
    planFeature: {
      color: colors.textMuted,
      fontSize: 15,
      lineHeight: 24,
      marginBottom: 4,
    },
    primaryButton: {
      backgroundColor: colors.cream,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 16,
    },
    primaryButtonText: {
      color: colors.accentText,
      fontWeight: '700',
      fontSize: 16,
    },
    secondaryButton: {
      backgroundColor: colors.background,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 16,
      borderWidth: 1,
      borderColor: colors.creamSoft,
    },
    secondaryButtonText: {
      color: colors.text,
      fontWeight: '700',
      fontSize: 16,
    },
    restoreButton: {
      backgroundColor: colors.background,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 12,
      borderWidth: 1,
      borderColor: colors.creamSoft,
    },
    restoreButtonText: {
      color: colors.text,
      fontWeight: '700',
      fontSize: 16,
    },
    backButton: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 6,
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
