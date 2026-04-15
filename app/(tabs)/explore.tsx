import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import ActionIconButton from '../../components/ActionIconButton';
import RenameItemModal from '../../components/RenameItemModal';
import { APP_COLORS } from '../../constants/theme';
import {
  buildShareText,
  deleteHistoryItem,
  getHistoryItems,
  HistoryItem,
  updateHistoryItemTitle,
} from '../../services/historyStorage';

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
  const [renamingItem, setRenamingItem] = useState<HistoryItem | null>(null);
  const [savingRename, setSavingRename] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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
      const confirmed = globalThis.confirm?.('¿Quieres eliminar este elemento del historial?');

      if (!confirmed) {
        return;
      }

      await deleteHistoryItem(id);
      await loadScreenData();
      return;
    }

    Alert.alert('Eliminar', '¿Quieres eliminar este elemento del historial?', [
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

  const handleRename = (item: HistoryItem) => {
    setRenamingItem(item);
  };

  const filteredItems = useMemo(() => {
    const normalizedNeedle = searchTerm
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    if (!normalizedNeedle) {
      return items;
    }

    return items.filter((item) => {
      const haystack = `${item.title} ${formatTypeLabel(item.type)} ${new Date(
        item.createdAt
      ).toLocaleString()}`
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

      return haystack.includes(normalizedNeedle);
    });
  }, [items, searchTerm]);

  const handleSaveRename = async (value: string) => {
    if (!renamingItem) return;

    try {
      setSavingRename(true);
      await updateHistoryItemTitle(renamingItem.id, value);
      setRenamingItem(null);
      await loadScreenData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo cambiar el nombre.';
      Alert.alert('Error renombrando', message);
    } finally {
      setSavingRename(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Historial de archivos</Text>
        <Text style={styles.subtitle}>
          Aquí aparecen los archivos, imágenes, audios y resultados que generaste.
        </Text>

        <TextInput
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder="Buscar por nombre o tipo"
          placeholderTextColor={APP_COLORS.textMuted}
          style={styles.searchInput}
        />
        <Text style={styles.searchMeta}>
          {filteredItems.length} de {items.length} elementos
        </Text>

        {items.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Todavía no hay contenido guardado</Text>
            <Text style={styles.emptyText}>
              Genera un archivo, una imagen, un audio o un modelo de examen y aparecerá aquí.
            </Text>
          </View>
        ) : filteredItems.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No encontramos coincidencias</Text>
            <Text style={styles.emptyText}>
              Prueba con otro nombre o borra el filtro para ver todo el historial.
            </Text>
          </View>
        ) : (
          filteredItems.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemMeta}>
                {formatTypeLabel(item.type)} • {new Date(item.createdAt).toLocaleString()}
              </Text>

              <View style={styles.actionRow}>
                <ActionIconButton
                  icon="eye-outline"
                  label="Abrir"
                  onPress={() => handleOpen(item)}
                  backgroundColor={APP_COLORS.surfaceAlt}
                />

                <ActionIconButton
                  icon="share-social-outline"
                  label="Compartir"
                  onPress={() => handleShare(item)}
                  backgroundColor={APP_COLORS.surfaceAlt}
                />

                <ActionIconButton
                  icon="create-outline"
                  label="Renombrar"
                  onPress={() => handleRename(item)}
                  backgroundColor={APP_COLORS.surfaceAlt}
                />

                <ActionIconButton
                  icon="trash-outline"
                  label="Eliminar"
                  onPress={() => handleDelete(item.id)}
                  backgroundColor={APP_COLORS.surfaceAlt}
                />
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* No agregamos AppBottomNav aquí: esta pantalla ya vive dentro de los tabs nativos. */}
      <RenameItemModal
        visible={renamingItem !== null}
        title="Renombrar elemento"
        initialValue={renamingItem?.title || ''}
        saving={savingRename}
        onClose={() => setRenamingItem(null)}
        onSave={handleSaveRename}
      />
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
    paddingHorizontal: 20,
    paddingTop: 80,
  },
  content: {
    paddingBottom: 180,
  },
  title: {
    color: APP_COLORS.text,
    fontSize: 34,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    color: APP_COLORS.textMuted,
    fontSize: 17,
    lineHeight: 24,
    marginBottom: 24,
  },
  searchInput: {
    backgroundColor: APP_COLORS.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: APP_COLORS.creamSoft,
    color: APP_COLORS.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  searchMeta: {
    color: APP_COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 14,
  },
  emptyCard: {
    backgroundColor: APP_COLORS.surface,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: APP_COLORS.creamSoft,
  },
  emptyTitle: {
    color: APP_COLORS.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
  },
  emptyText: {
    color: APP_COLORS.textMuted,
    fontSize: 15,
    lineHeight: 24,
  },
  itemCard: {
    backgroundColor: APP_COLORS.surface,
    borderRadius: 18,
    padding: 18,
    marginTop: 14,
    borderWidth: 1,
    borderColor: APP_COLORS.creamSoft,
  },
  itemTitle: {
    color: APP_COLORS.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  itemMeta: {
    color: APP_COLORS.textMuted,
    fontSize: 13,
    marginBottom: 14,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
});
