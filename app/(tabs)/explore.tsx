import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { buildShareText, deleteHistoryItem, getHistoryItems, HistoryItem } from '../../services/historyStorage';

function formatTypeLabel(type: HistoryItem['type']) {
  switch (type) {
    case 'file':
      return 'Archivo';
    case 'image':
      return 'Imagen';
    case 'audio':
      return 'Audio';
    case 'exam-model':
      return 'Modelo de examen';
    default:
      return 'Contenido';
  }
}

export default function ExploreScreen() {
  const [items, setItems] = useState<HistoryItem[]>([]);

  const loadScreenData = useCallback(async () => {
    const history = await getHistoryItems();
    setItems(history);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadScreenData();
    }, [loadScreenData])
  );

  const handleDelete = async (id: string) => {
    if (Platform.OS === 'web') {
      const confirmed = globalThis.confirm?.('Quieres eliminar este elemento del historial?');

      if (!confirmed) {
        return;
      }

      await deleteHistoryItem(id);
      await loadScreenData();
      return;
    }

    Alert.alert('Eliminar', 'Quieres eliminar este elemento del historial?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await deleteHistoryItem(id);
          await loadScreenData();
        },
      },
    ]);
  };

  const handleShare = async (item: HistoryItem) => {
    try {
      const text = buildShareText(item);
      await Share.share({
        message: text,
        title: item.title,
      });
    } catch (error) {
      console.error('Error compartiendo:', error);
      Alert.alert('Error', 'No se pudo compartir este elemento.');
    }
  };

  const handleOpen = (item: HistoryItem) => {
    router.push({
      pathname: '/saved-item',
      params: { id: item.id },
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Historial de archivos</Text>
      <Text style={styles.subtitle}>
        Aqui aparecen los archivos, imagenes, audios y resultados que generaste.
      </Text>

      {items.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Todavia no hay contenido guardado</Text>
          <Text style={styles.emptyText}>
            Genera un archivo, una imagen, un audio o un modelo de examen y aparecera aqui.
          </Text>
        </View>
      ) : (
        items.map((item) => (
          <View key={item.id} style={styles.itemCard}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemMeta}>
              {formatTypeLabel(item.type)} • {new Date(item.createdAt).toLocaleString()}
            </Text>

            <View style={styles.buttonRow}>
              <Pressable style={styles.openButton} onPress={() => handleOpen(item)}>
                <Text style={styles.openButtonText}>Abrir</Text>
              </Pressable>

              <Pressable style={styles.shareButton} onPress={() => handleShare(item)}>
                <Text style={styles.shareButtonText}>Compartir</Text>
              </Pressable>

              <Pressable style={styles.deleteButton} onPress={() => handleDelete(item.id)}>
                <Text style={styles.deleteButtonText}>Eliminar</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingHorizontal: 20,
    paddingTop: 80,
  },
  content: {
    paddingBottom: 40,
  },
  title: {
    color: 'white',
    fontSize: 34,
    fontWeight: 'bold',
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
    marginTop: 14,
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
    marginBottom: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  openButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  openButtonText: {
    color: 'white',
    fontWeight: '700',
  },
  shareButton: {
    flex: 1,
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  shareButtonText: {
    color: 'white',
    fontWeight: '700',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#7f1d1d',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: '700',
  },
});
