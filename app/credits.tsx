import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AppBottomNav from '../components/AppBottomNav';
import CreditCostTable from '../components/CreditCostTable';
import { useAppPreferences } from '../contexts/AppPreferencesContext';
import { useSyncedBilling } from '../hooks/useSyncedBilling';
import { purchaseCreditPack } from '../services/purchasesService';

type CreditPack = {
  packSize: 'basic' | 'medium' | 'large';
  titleKey: 'credits.packBasic' | 'credits.packMedium' | 'credits.packLarge';
  credits: number;
  price: string;
  equivalents: string[];
};

const PACKS: CreditPack[] = [
  {
    packSize: 'basic',
    titleKey: 'credits.packBasic',
    credits: 50000,
    price: '$10',
    equivalents: ['Aproximadamente 521 textos', '250 imágenes', '100 minutos de audio'],
  },
  {
    packSize: 'medium',
    titleKey: 'credits.packMedium',
    credits: 120000,
    price: '$20',
    equivalents: ['Aproximadamente 1250 textos', '500 imágenes', '240 minutos de audio'],
  },
  {
    packSize: 'large',
    titleKey: 'credits.packLarge',
    credits: 300000,
    price: '$40',
    equivalents: ['Aproximadamente 3125 textos', '1200 imágenes', '600 minutos de audio'],
  },
];

function formatDate(dateValue: number, locale: string) {
  return new Date(dateValue).toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function CreditsScreen() {
  const { colors, t, locale } = useAppPreferences();
  const [isLoading, setIsLoading] = useState(false);

  const styles = useMemo(() => createStyles(colors), [colors]);

  const { billing, refreshBilling, nativePurchasesEnabled } = useSyncedBilling();

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

  const buyPack = async (pack: CreditPack) => {
    try {
      setIsLoading(true);

      if (!nativePurchasesEnabled) {
        Alert.alert(
          'No disponible',
          'Las compras nativas no están configuradas todavía para esta app.'
        );
        return;
      }

      await purchaseCreditPack(pack.credits, pack.packSize);
      await refreshBilling();
      Alert.alert(
        'Compra completada',
        `Se agregaron ${pack.credits} créditos. Recuerda que vencen a los 30 días.`
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
        <Text style={styles.title}>{t('credits.title')}</Text>
        <Text style={styles.subtitle}>{t('credits.subtitle')}</Text>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>{t('credits.balanceLabel')}</Text>
          <Text style={styles.balanceValue}>{billing.credits} créditos</Text>
          <Text style={styles.balancePlan}>
            {billing.plan === 'premium' ? t('credits.planPremium') : t('credits.planFree')}
          </Text>
          <Text style={styles.balanceExpiration}>
            {nextExpiration
              ? t('credits.nextExpiration', {
                  date: formatDate(nextExpiration.expiresAt, locale),
                })
              : t('credits.noCredits')}
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>{t('credits.importanceTitle')}</Text>
          <Text style={styles.infoText}>{t('credits.importanceLine1')}</Text>
          <Text style={styles.infoText}>
            {nativePurchasesEnabled
              ? t('credits.importanceLine2Native')
              : t('credits.importanceLine2Disabled')}
          </Text>
        </View>

        <CreditCostTable />

        <Text style={styles.sectionTitle}>{t('credits.choosePack')}</Text>

        <View style={styles.packList}>
          {PACKS.map((pack) => (
            <View key={pack.titleKey} style={styles.packCard}>
              <Text style={styles.packTitle}>{t(pack.titleKey)}</Text>
              <Text style={styles.packCredits}>{pack.credits} créditos</Text>
              <Text style={styles.packPrice}>{pack.price}</Text>

              <View style={styles.equivalentsBox}>
                <Text style={styles.equivalentsTitle}>{t('credits.approx')}</Text>
                {pack.equivalents.map((item) => (
                  <Text key={item} style={styles.equivalentText}>
                    - {item}
                  </Text>
                ))}
              </View>

              <Pressable
                style={styles.buyButton}
                onPress={() => {
                  void buyPack(pack);
                }}
                disabled={isLoading}
              >
                <Text style={styles.buyButtonText}>
                  {isLoading ? t('common.loading') : t('credits.buyPack')}
                </Text>
              </Pressable>
            </View>
          ))}
        </View>

        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>{t('credits.referenceTitle')}</Text>
          <Text style={styles.noteText}>{t('credits.referenceText')}</Text>
        </View>

        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>{t('credits.back')}</Text>
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
    balanceCard: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 18,
      marginBottom: 16,
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
    balanceExpiration: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 22,
    },
    infoCard: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 18,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.creamSoft,
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
    sectionTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '700',
      marginBottom: 14,
    },
    packList: {
      gap: 14,
    },
    packCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.creamSoft,
    },
    packTitle: {
      color: colors.text,
      fontSize: 24,
      fontWeight: '800',
      marginBottom: 8,
    },
    packCredits: {
      color: colors.textMuted,
      fontSize: 18,
      marginBottom: 6,
    },
    packPrice: {
      color: colors.text,
      fontSize: 32,
      fontWeight: '800',
      marginBottom: 16,
    },
    equivalentsBox: {
      backgroundColor: colors.background,
      borderRadius: 16,
      padding: 14,
      marginBottom: 18,
      borderWidth: 1,
      borderColor: colors.creamSoft,
    },
    equivalentsTitle: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '700',
      marginBottom: 10,
    },
    equivalentText: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 22,
      marginBottom: 4,
    },
    buyButton: {
      backgroundColor: colors.cream,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
    },
    buyButtonText: {
      color: colors.accentText,
      fontWeight: '700',
      fontSize: 16,
    },
    noteCard: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 18,
      marginTop: 20,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.creamSoft,
    },
    noteTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 8,
    },
    noteText: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 22,
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
