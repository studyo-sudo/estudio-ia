import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AppBottomNav from '../components/AppBottomNav';
import { ENABLE_FAKE_BILLING } from '../constants/env';
import { addCredits, BillingState, getBillingState } from '../services/billingStorage';

type CreditPack = {
  title: string;
  credits: number;
  price: string;
  equivalents: string[];
};

const PACKS: CreditPack[] = [
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

export default function CreditsScreen() {
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

  const nextExpiration = useMemo(() => {
    if (billing.creditGrants.length === 0) {
      return null;
    }

    return billing.creditGrants.reduce((earliest, grant) =>
      grant.expiresAt < earliest.expiresAt ? grant : earliest
    );
  }, [billing.creditGrants]);

  const buyPack = async (amount: number) => {
    if (!ENABLE_FAKE_BILLING) {
      Alert.alert(
        'No disponible',
        'Los creditos reales todavia necesitan integracion con backend o tienda.'
      );
      return;
    }

    await addCredits(amount);
    await loadBilling();
    Alert.alert(
      'Compra registrada',
      `Se agregaron ${amount} creditos. Recuerda que vencen a los 30 dias.`
    );
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
      <Text style={styles.title}>Creditos</Text>
      <Text style={styles.subtitle}>Compra creditos para seguir estudiando cuando lo necesites.</Text>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Saldo actual</Text>
        <Text style={styles.balanceValue}>{billing.credits} creditos</Text>
        <Text style={styles.balancePlan}>
          {billing.plan === 'premium' ? 'Plan Premium activo' : 'Plan Free'}
        </Text>
        <Text style={styles.balanceExpiration}>
          {nextExpiration
            ? `Proximo vencimiento: ${formatDate(nextExpiration.expiresAt)}`
            : 'Todavia no tienes creditos activos.'}
        </Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Importante</Text>
        <Text style={styles.infoText}>Los creditos duran 30 dias desde la compra.</Text>
        <Text style={styles.infoText}>
          {ENABLE_FAKE_BILLING
            ? 'Esta pantalla funciona en modo demo y guarda los creditos localmente o en tu cuenta.'
            : 'Los packs estan visibles, pero la compra real todavia no esta conectada.'}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Elige un pack</Text>

      <View style={styles.packList}>
        {PACKS.map((pack) => (
          <View key={pack.title} style={styles.packCard}>
            <Text style={styles.packTitle}>{pack.title}</Text>
            <Text style={styles.packCredits}>{pack.credits} creditos</Text>
            <Text style={styles.packPrice}>{pack.price}</Text>

            <View style={styles.equivalentsBox}>
              <Text style={styles.equivalentsTitle}>Equivale aprox. a:</Text>
              {pack.equivalents.map((item) => (
                <Text key={item} style={styles.equivalentText}>
                  - {item}
                </Text>
              ))}
            </View>

            <Pressable
              style={styles.buyButton}
              onPress={() => {
                void buyPack(pack.credits);
              }}
            >
              <Text style={styles.buyButtonText}>
                {ENABLE_FAKE_BILLING ? 'Comprar pack' : 'Proximamente'}
              </Text>
            </Pressable>
          </View>
        ))}
      </View>

      <View style={styles.noteCard}>
        <Text style={styles.noteTitle}>Referencia de consumo</Text>
        <Text style={styles.noteText}>
          Estos valores son aproximados y pueden variar segun longitud del contenido,
          complejidad del analisis y cantidad de material generado.
        </Text>
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
  balanceCard: {
    backgroundColor: '#1e293b',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
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
  balanceExpiration: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 22,
  },
  infoCard: {
    backgroundColor: '#111827',
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
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
  sectionTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 14,
  },
  packList: {
    gap: 14,
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
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 16,
  },
  equivalentsBox: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
  },
  equivalentsTitle: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  equivalentText: {
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
  },
  buyButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  noteCard: {
    backgroundColor: '#111827',
    borderRadius: 18,
    padding: 18,
    marginTop: 20,
    marginBottom: 12,
  },
  noteTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  noteText: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 22,
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
