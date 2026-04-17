import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import CreditCostTable from '../../components/CreditCostTable';
import { useAppPreferences } from '../../contexts/AppPreferencesContext';
import { useSyncedBilling } from '../../hooks/useSyncedBilling';
import {
  canUseNativePurchases,
  purchaseCreditPack,
  purchasePremiumPlan,
  restorePurchasesAndSyncPlan,
} from '../../services/purchasesService';

type CreditPack = {
  packSize: 'starter' | 'basic' | 'medium' | 'large';
  titleKey: 'shop.packStarter' | 'shop.packBasic' | 'shop.packMedium' | 'shop.packLarge';
  credits: number;
  price: string;
};

const CREDIT_PACKS: CreditPack[] = [
  {
    packSize: 'starter',
    titleKey: 'shop.packStarter',
    credits: 5000,
    price: '$5',
  },
  {
    packSize: 'basic',
    titleKey: 'shop.packBasic',
    credits: 15000,
    price: '$10',
  },
  {
    packSize: 'medium',
    titleKey: 'shop.packMedium',
    credits: 40000,
    price: '$20',
  },
  {
    packSize: 'large',
    titleKey: 'shop.packLarge',
    credits: 100000,
    price: '$40',
  },
];

function formatDate(dateValue: number, locale: string) {
  return new Date(dateValue).toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function ShopScreen() {
  const { colors, t, locale } = useAppPreferences();
  const [isLoading, setIsLoading] = useState(false);

  const styles = useMemo(() => createStyles(colors), [colors]);
  const creditsUnit = t('shop.creditsUnit');
  const nativePurchasesEnabled = canUseNativePurchases();
  const { billing, refreshBilling } = useSyncedBilling();
  const isPremium = billing.plan === 'premium';

  const formatCredits = useCallback(
    (value: number) => value.toLocaleString(locale),
    [locale]
  );

  const buildPackCapabilities = useCallback(
    (credits: number) => {
      const effectiveCredits = isPremium ? Math.round(credits * 1.1) : credits;

      return [
        {
          label: t('tutor.title'),
          value: `${formatCredits(Math.floor(effectiveCredits / 96))} ${t('shop.countChats')}`,
        },
        {
          label: t('problem.title'),
          value: `${formatCredits(Math.floor(effectiveCredits / 200))} ${t('shop.countProblems')}`,
        },
        {
          label: t('file.title'),
          value: `${formatCredits(Math.floor(effectiveCredits / 480))} ${t('shop.countFiles')}`,
        },
        {
          label: t('cost.audioPerMinute'),
          value: isPremium
            ? `${formatCredits(Math.floor(effectiveCredits / 120))} ${t('shop.countMinutes')}`
            : t('shop.audioPremiumOnly'),
          muted: !isPremium,
        },
      ];
    },
    [formatCredits, isPremium, t]
  );

  useFocusEffect(
    useCallback(() => {
      void refreshBilling();
    }, [refreshBilling])
  );

  const nextExpiration = useMemo(() => {
    if (billing.creditGrants.length === 0) {
      return null;
    }

    return billing.creditGrants.reduce((earliest, grant) =>
      grant.expiresAt < earliest.expiresAt ? grant : earliest
    );
  }, [billing.creditGrants]);

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

  const handleBuyPack = async (pack: CreditPack) => {
    try {
      setIsLoading(true);

      if (!nativePurchasesEnabled) {
        Alert.alert(
          'No disponible',
          'Las compras nativas no están configuradas todavía para esta app.'
        );
        return;
      }

      const creditsAdded = await purchaseCreditPack(pack.credits, pack.packSize);
      await refreshBilling();
      Alert.alert(
        'Compra completada',
        `Se agregaron ${formatCredits(creditsAdded)} créditos. Recuerda que vencen a los 30 días.`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo comprar el pack.';
      Alert.alert('Compra no completada', message);
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
        <Text style={styles.title}>{t('shop.title')}</Text>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>{t('shop.balanceLabel')}</Text>
          <Text style={styles.balanceValue}>
            {billing.credits} {creditsUnit}
          </Text>
          <Text style={styles.balancePlan}>
            {billing.plan === 'premium' ? t('shop.planPremium') : t('shop.planFree')}
          </Text>
          {nextExpiration ? (
            <Text style={styles.expirationText}>
              {t('shop.nextExpiration', { date: formatDate(nextExpiration.expiresAt, locale) })}
            </Text>
          ) : (
            <Text style={styles.expirationText}>{t('shop.noCredits')}</Text>
          )}
        </View>

        <View
          style={[
            styles.premiumCard,
            billing.plan === 'premium' && styles.premiumCardActive,
          ]}
        >
          <Text style={styles.sectionTitle}>{t('shop.premiumTitle')}</Text>
          <Text style={styles.premiumPrice}>{t('shop.premiumPrice')}</Text>
          <Text style={styles.premiumFeature}>{t('shop.premiumFeature1')}</Text>
          <Text style={styles.premiumFeature}>{t('shop.premiumFeature2')}</Text>
          <Text style={styles.premiumFeature}>{t('shop.premiumFeature3')}</Text>

          <Pressable
            style={styles.primaryButton}
            onPress={handleActivatePremium}
            disabled={isLoading}
          >
            <Text style={styles.primaryButtonText}>
              {billing.plan === 'premium'
                ? t('shop.premiumActive')
                : isLoading
                ? t('common.loading')
                : t('shop.buyPremium')}
            </Text>
          </Pressable>

          {nativePurchasesEnabled ? (
            <Pressable
              style={styles.secondaryButton}
              onPress={handleRestore}
              disabled={isLoading}
            >
              <Text style={styles.secondaryButtonText}>{t('shop.restorePurchases')}</Text>
            </Pressable>
          ) : null}
        </View>

        <Text style={styles.sectionTitle}>{t('shop.packTitle')}</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={300 + 14}
          snapToAlignment="start"
          contentContainerStyle={styles.packList}
        >
          {CREDIT_PACKS.map((pack) => {
            const capabilities = buildPackCapabilities(pack.credits);

            return (
              <View key={pack.titleKey} style={styles.packCard}>
                <Text style={styles.packTitle}>{t(pack.titleKey)}</Text>
                <Text style={styles.packCredits}>
                  {formatCredits(pack.credits)} {creditsUnit}
                </Text>
                <Text style={styles.packPrice}>{pack.price}</Text>
                <Text style={styles.packBonus}>{t('shop.premiumBonus')}</Text>
                <Text style={styles.packHint}>{t('shop.packEquiv')}</Text>

                <View style={styles.packCapabilityList}>
                  {capabilities.map((item) => (
                    <View key={`${pack.packSize}-${item.label}`} style={styles.packCapabilityRow}>
                      <Text style={styles.packCapabilityLabel}>{item.label}</Text>
                      <Text
                        style={[
                          styles.packCapabilityValue,
                          item.muted && styles.packAudioNote,
                        ]}
                      >
                        {item.value}
                      </Text>
                    </View>
                  ))}
                </View>

                <Pressable
                  style={styles.buyButton}
                  onPress={() => {
                    void handleBuyPack(pack);
                  }}
                  disabled={isLoading}
                >
                  <Text style={styles.buyButtonText}>
                    {isLoading ? t('common.loading') : t('shop.packBuy')}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </ScrollView>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>{t('shop.importanceTitle')}</Text>
          <Text style={styles.infoText}>{t('shop.importanceLine1')}</Text>
          <Text style={styles.infoText}>
            {nativePurchasesEnabled
              ? t('shop.importanceLine2Native', { platform: Platform.OS })
              : t('shop.importanceLine2Disabled')}
          </Text>
        </View>

        <CreditCostTable />
      </ScrollView>
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
      paddingTop: 80,
      paddingBottom: 160,
    },
    title: {
      color: colors.text,
      fontSize: 34,
      fontWeight: '800',
      marginBottom: 10,
    },
    balanceCard: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 18,
      marginBottom: 18,
      borderWidth: 1,
      borderColor: colors.creamSoft,
    },
    balanceLabel: {
      color: colors.textMuted,
      fontSize: 14,
      marginBottom: 8,
    },
    balanceValue: {
      color: colors.text,
      fontSize: 28,
      fontWeight: '800',
      marginBottom: 6,
    },
    balancePlan: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '700',
      marginBottom: 6,
    },
    expirationText: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 22,
    },
    infoCard: {
      backgroundColor: colors.surfaceDeep,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.creamSoft,
      padding: 20,
      marginTop: 18,
      shadowColor: colors.shadow,
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
      marginBottom: 4,
    },
    premiumCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 20,
      marginBottom: 18,
      borderWidth: 1,
      borderColor: colors.creamSoft,
    },
    premiumCardActive: {
      borderWidth: 2,
      borderColor: colors.text,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 22,
      fontWeight: '800',
      marginBottom: 12,
    },
    premiumPrice: {
      color: colors.text,
      fontSize: 28,
      fontWeight: '800',
      marginBottom: 14,
    },
    premiumFeature: {
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
      backgroundColor: colors.surfaceAlt,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 12,
    },
    secondaryButtonText: {
      color: colors.text,
      fontWeight: '700',
      fontSize: 16,
    },
    packList: {
      gap: 14,
      paddingRight: 20,
    },
    packCard: {
      width: 300,
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.creamSoft,
    },
    packTitle: {
      color: colors.text,
      fontSize: 22,
      fontWeight: '800',
      marginBottom: 8,
    },
    packCredits: {
      color: colors.text,
      fontSize: 28,
      fontWeight: '800',
      marginBottom: 4,
    },
    packPrice: {
      color: colors.text,
      fontSize: 24,
      fontWeight: '800',
      marginBottom: 6,
    },
    packBonus: {
      color: '#2f9e44',
      fontSize: 13,
      fontWeight: '700',
      marginBottom: 10,
    },
    packHint: {
      color: colors.textMuted,
      fontSize: 15,
      fontWeight: '700',
      marginBottom: 8,
    },
    packCapabilityList: {
      gap: 8,
    },
    packCapabilityRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    packCapabilityLabel: {
      color: colors.textMuted,
      fontSize: 14,
      flex: 1,
    },
    packCapabilityValue: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '800',
      textAlign: 'right',
    },
    packAudioNote: {
      color: colors.textMuted,
      fontWeight: '700',
    },
    buyButton: {
      backgroundColor: colors.cream,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 16,
    },
    buyButtonText: {
      color: colors.accentText,
      fontWeight: '700',
      fontSize: 16,
    },
  });
}
