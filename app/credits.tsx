import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ENABLE_FAKE_BILLING } from '../constants/env';
import { addCredits, BillingState, getBillingState } from '../services/billingStorage';

type CreditPack = {
  title: string;
  credits: number;
  price: string;
  equivalents: string[];
};

export default function CreditsScreen() {
  const [billing, setBilling] = useState<BillingState>({
    plan: 'free',
    credits: 0,
  });

  const isPremium = billing.plan === 'premium';

  const loadBilling = useCallback(async () => {
    const state = await getBillingState();
    setBilling(state);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadBilling();
    }, [loadBilling])
  );

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
  };

  const packs: CreditPack[] = isPremium
    ? [
        {
          title: 'Pack chico',
          credits: 50,
          price: '$5',
          equivalents: [
            'Aprox. 10 PDFs',
            'Aprox. 25 imagenes',
            'Aprox. 25 min de audio',
            'Ideal para uso puntual',
          ],
        },
        {
          title: 'Pack medio',
          credits: 120,
          price: '$10',
          equivalents: [
            'Aprox. 24 PDFs',
            'Aprox. 60 imagenes',
            'Aprox. 1 hora de audio',
            'Ideal para semanas intensas',
          ],
        },
        {
          title: 'Pack grande',
          credits: 300,
          price: '$20',
          equivalents: [
            'Aprox. 60 PDFs',
            'Aprox. 150 imagenes',
            'Aprox. 2 h 30 min de audio',
            'Ideal para heavy users',
          ],
        },
      ]
    : [
        {
          title: 'Pack chico',
          credits: 50,
          price: '$10',
          equivalents: [
            'Aprox. 10 PDFs',
            'Aprox. 25 imagenes',
            'Aprox. 25 min de audio',
            'En Free los creditos cuestan mas',
          ],
        },
        {
          title: 'Pack medio',
          credits: 120,
          price: '$20',
          equivalents: [
            'Aprox. 24 PDFs',
            'Aprox. 60 imagenes',
            'Aprox. 1 hora de audio',
            'Premium te da mejor valor',
          ],
        },
        {
          title: 'Pack grande',
          credits: 300,
          price: '$40',
          equivalents: [
            'Aprox. 60 PDFs',
            'Aprox. 150 imagenes',
            'Aprox. 2 h 30 min de audio',
            'Pensado para urgencias grandes',
          ],
        },
      ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Creditos</Text>
      <Text style={styles.subtitle}>
        {isPremium
          ? 'Como usuario Premium, obtienes mejor precio en creditos.'
          : 'En Free los creditos son mas caros. Premium te da mejor valor.'}
      </Text>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Saldo actual</Text>
        <Text style={styles.balanceValue}>{billing.credits} creditos</Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Modo de compra</Text>
        <Text style={styles.infoText}>
          {ENABLE_FAKE_BILLING
            ? 'Esta pantalla funciona en modo demo y guarda los creditos localmente.'
            : 'Los packs estan visibles, pero la compra real todavia no esta conectada.'}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Elige un pack</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalList}
      >
        {packs.map((pack) => (
          <View key={pack.title} style={styles.packCard}>
            <Text style={styles.packTitle}>{pack.title}</Text>
            <Text style={styles.packCredits}>{pack.credits} creditos</Text>
            <Text style={styles.packPrice}>{pack.price}</Text>

            <View style={styles.equivalentsBox}>
              <Text style={styles.equivalentsTitle}>Equivale aprox. a:</Text>
              {pack.equivalents.map((item, index) => (
                <Text key={index} style={styles.equivalentText}>
                  • {item}
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
                {ENABLE_FAKE_BILLING ? 'Comprar' : 'Proximamente'}
              </Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>

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
  },
  sectionTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 14,
  },
  horizontalList: {
    paddingRight: 20,
  },
  packCard: {
    width: 300,
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
    marginRight: 14,
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
    minHeight: 150,
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
