import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AppBottomNav from '../components/AppBottomNav';
import { getHistoryItems, HistoryItem } from '../services/historyStorage';

export default function FlashcardsHistoryScreen() {
  const [items, setItems] = useState<HistoryItem[]>([]);

  const loadItems = useCallback(async () => {
    const history = await getHistoryItems();

    const flashcardItems = history.filter(
      (item) =>
        item.payload.kind === 'study-result' &&
        Array.isArray(item.payload.result.flashcards) &&
        item.payload.result.flashcards.length > 0
    );

    setItems(flashcardItems);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadItems();
    }, [loadItems])
  );

  const openFlashcards = (item: HistoryItem) => {
    if (item.payload.kind !== 'study-result') return;

    router.push({
      pathname: '/flashcards',
      params: {
        cards: JSON.stringify(item.payload.result.flashcards),
      },
    });
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
      <Text style={styles.title}>Flashcards</Text>
      <Text style={styles.subtitle}>
        Historial de flashcards generadas para estudiar cuando quieras.
      </Text>

      {items.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Todavia no hay flashcards guardadas</Text>
          <Text style={styles.emptyText}>
            Genera contenido desde archivo, imagen o audio y aparecera aqui.
          </Text>
        </View>
      ) : (
        items.map((item) => {
          if (item.payload.kind !== 'study-result') return null;

          return (
            <View key={item.id} style={styles.itemCard}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemMeta}>{new Date(item.createdAt).toLocaleString()}</Text>
              <Text style={styles.itemCount}>
                {item.payload.result.flashcards.length} flashcards
              </Text>

              <Pressable style={styles.openButton} onPress={() => openFlashcards(item)}>
                <Text style={styles.openButtonText}>Estudiar flashcards</Text>
              </Pressable>
            </View>
          );
        })
      )}

        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Volver</Text>
        </Pressable>
      </ScrollView>

      <AppBottomNav activeTab="history" />
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
  emptyCard: {
    backgroundColor: '#1e293b',
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
  },
  emptyTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
  },
  emptyText: {
    color: '#cbd5e1',
    fontSize: 15,
    lineHeight: 24,
  },
  itemCard: {
    backgroundColor: '#1e293b',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
  },
  itemTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  itemMeta: {
    color: '#94a3b8',
    fontSize: 13,
    marginBottom: 8,
  },
  itemCount: {
    color: '#cbd5e1',
    fontSize: 15,
    marginBottom: 14,
  },
  openButton: {
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  openButtonText: {
    color: 'white',
    fontWeight: '700',
  },
  backButton: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  backButtonText: {
    color: '#cbd5e1',
    fontWeight: '700',
    fontSize: 16,
  },
});
