import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import ActionIconButton from '../../components/ActionIconButton';
import RenameItemModal from '../../components/RenameItemModal';
import { AppColors } from '../../constants/theme';
import { useAppPreferences } from '../../contexts/AppPreferencesContext';
import {
  buildShareText,
  deleteHistoryItem,
  getHistoryItems,
  HistoryItem,
  updateHistoryItemTitle,
} from '../../services/historyStorage';
import {
  buildTutorShareText,
  deleteTutorChat,
  getTutorChats,
  TutorChatThread,
  updateTutorChatTitle,
} from '../../services/tutorChatStorage';

type RenameTarget =
  | { kind: 'history'; item: HistoryItem }
  | { kind: 'tutor'; thread: TutorChatThread };

type CardBadge = {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
};

type HistorySortMode = 'alphabetical' | 'date';
type HistorySortDirection = 'asc' | 'desc';

type FeedEntry =
  | {
      kind: 'history';
      id: string;
      title: string;
      badge: CardBadge;
      metaText: string;
      sortTitle: string;
      sortDate: number;
      item: HistoryItem;
    }
  | {
      kind: 'tutor';
      id: string;
      title: string;
      badge: CardBadge;
      metaText: string;
      sortTitle: string;
      sortDate: number;
      previewText: string;
      thread: TutorChatThread;
    };

function getHistoryBadge(item: HistoryItem): CardBadge {
  if (item.payload.kind === 'exam-model') {
    return { icon: 'school-outline', color: '#fda4af' };
  }

  switch (item.type) {
    case 'file':
      return { icon: 'folder-open-outline', color: '#93c5fd' };
    case 'image':
      return { icon: 'camera-outline', color: '#fcd34d' };
    case 'audio':
      return { icon: 'mic-outline', color: '#86efac' };
    default:
      return { icon: 'document-text-outline', color: '#c4b5fd' };
  }
}

function getTutorBadge(): CardBadge {
  return { icon: 'school-outline', color: '#7dd3fc' };
}

function formatFeedDate(date: number, locale: string) {
  return new Date(date).toLocaleString(locale);
}

export default function ExploreScreen() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [tutorThreads, setTutorThreads] = useState<TutorChatThread[]>([]);
  const [renameTarget, setRenameTarget] = useState<RenameTarget | null>(null);
  const [savingRename, setSavingRename] = useState(false);
  const [sortConfig, setSortConfig] = useState<{
    mode: HistorySortMode;
    direction: HistorySortDirection;
  }>({
    mode: 'date',
    direction: 'desc',
  });
  const { colors, locale } = useAppPreferences();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const loadScreenData = useCallback(async () => {
    const [history, tutorChats] = await Promise.all([getHistoryItems(), getTutorChats()]);
    setItems(history);
    setTutorThreads(tutorChats);
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

  const handleRename = (item: HistoryItem) => {
    setRenameTarget({ kind: 'history', item });
  };

  const handleTutorOpen = (thread: TutorChatThread) => {
    router.push({
      pathname: '/tutor-chat',
      params: { chatId: thread.id },
    } as never);
  };

  const handleTutorShare = async (thread: TutorChatThread) => {
    try {
      await Share.share({
        message: buildTutorShareText(thread),
        title: thread.title,
      });
    } catch (error) {
      console.error('Error compartiendo chat de Tutor:', error);
      Alert.alert('Error', 'No se pudo compartir este chat.');
    }
  };

  const handleTutorDelete = async (thread: TutorChatThread) => {
    const confirmDelete = async () => {
      await deleteTutorChat(thread.id);
      await loadScreenData();
    };

    if (Platform.OS === 'web') {
      const confirmed = globalThis.confirm?.('Quieres eliminar este chat del Tutor?');

      if (!confirmed) {
        return;
      }

      await confirmDelete();
      return;
    }

    Alert.alert('Eliminar chat', 'Quieres eliminar este chat del Tutor?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          void confirmDelete();
        },
      },
    ]);
  };

  const handleTutorRename = (thread: TutorChatThread) => {
    setRenameTarget({ kind: 'tutor', thread });
  };

  const handleSaveRename = async (value: string) => {
    if (!renameTarget) return;

    try {
      setSavingRename(true);

      if (renameTarget.kind === 'history') {
        await updateHistoryItemTitle(renameTarget.item.id, value);
      } else {
        await updateTutorChatTitle(renameTarget.thread.id, value);
      }

      setRenameTarget(null);
      await loadScreenData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo cambiar el nombre.';
      Alert.alert('Error renombrando', message);
    } finally {
      setSavingRename(false);
    }
  };

  const toggleSort = useCallback((mode: HistorySortMode) => {
    setSortConfig((current) => {
      if (current.mode === mode) {
        return {
          ...current,
          direction: current.direction === 'asc' ? 'desc' : 'asc',
        };
      }

      return {
        mode,
        direction: mode === 'alphabetical' ? 'asc' : 'desc',
      };
    });
  }, []);

  const feedEntries = useMemo<FeedEntry[]>(() => {
    const collator = new Intl.Collator(locale, {
      sensitivity: 'base',
      numeric: true,
    });

    const historyEntries: FeedEntry[] = items.map((item) => ({
      kind: 'history',
      id: item.id,
      title: item.title,
      badge: getHistoryBadge(item),
      metaText: formatFeedDate(item.createdAt, locale),
      sortTitle: item.title,
      sortDate: item.createdAt,
      item,
    }));

    const tutorEntries: FeedEntry[] = tutorThreads.map((thread) => {
      const previewMessage = thread.messages[thread.messages.length - 1]?.text || '';
      const previewText =
        previewMessage.length > 92 ? `${previewMessage.slice(0, 92).trim()}...` : previewMessage;

      return {
        kind: 'tutor',
        id: thread.id,
        title: thread.title,
        badge: getTutorBadge(),
        metaText: formatFeedDate(thread.updatedAt, locale),
        sortTitle: thread.title,
        sortDate: thread.updatedAt,
        previewText,
        thread,
      };
    });

    const combined = [...historyEntries, ...tutorEntries];

    combined.sort((a, b) => {
      if (sortConfig.mode === 'alphabetical') {
        const comparison = collator.compare(a.sortTitle, b.sortTitle);
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      }

      return sortConfig.direction === 'asc' ? a.sortDate - b.sortDate : b.sortDate - a.sortDate;
    });

    return combined;
  }, [items, tutorThreads, locale, sortConfig]);

  const alphaDirection =
    sortConfig.mode === 'alphabetical' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '';
  const dateDirection = sortConfig.mode === 'date' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '';

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Historial</Text>
        <Text style={styles.subtitle}>
          Aqui aparecen los archivos, imagenes, audios, modelos de examen y chats de Tutor que
          generaste.
        </Text>

        {feedEntries.length > 0 ? (
          <View style={styles.sortRow}>
            <Pressable
              style={[
                styles.sortChip,
                sortConfig.mode === 'alphabetical' && styles.sortChipActive,
              ]}
              onPress={() => toggleSort('alphabetical')}
            >
              <Text
                style={[
                  styles.sortChipText,
                  sortConfig.mode === 'alphabetical' && styles.sortChipTextActive,
                ]}
              >
                A-Z {alphaDirection}
              </Text>
            </Pressable>

            <Pressable
              style={[styles.sortChip, sortConfig.mode === 'date' && styles.sortChipActive]}
              onPress={() => toggleSort('date')}
            >
              <Text
                style={[styles.sortChipText, sortConfig.mode === 'date' && styles.sortChipTextActive]}
              >
                Fecha {dateDirection}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {feedEntries.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Todavia no hay contenido guardado</Text>
            <Text style={styles.emptyText}>
              Genera un archivo, una imagen, un audio, un modelo de examen o un chat del Tutor y
              aparecera aqui.
            </Text>
          </View>
        ) : null}

        {feedEntries.map((entry) => {
          if (entry.kind === 'history') {
            return (
              <View key={entry.id} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <View style={styles.itemHeaderText}>
                    <Text style={styles.itemTitle}>{entry.title}</Text>
                    <Text style={styles.itemMeta}>{entry.metaText}</Text>
                  </View>

                  <View style={styles.itemBadge}>
                    <Ionicons name={entry.badge.icon} size={18} color={entry.badge.color} />
                  </View>
                </View>

                <View style={styles.actionRow}>
                  <ActionIconButton
                    icon="eye-outline"
                    label="Abrir"
                    onPress={() => handleOpen(entry.item)}
                    backgroundColor={colors.surfaceAlt}
                    iconColor={colors.cream}
                  />

                  <ActionIconButton
                    icon="share-social-outline"
                    label="Compartir"
                    onPress={() => handleShare(entry.item)}
                    backgroundColor="#234a6e"
                    iconColor="#7dd3fc"
                  />

                  <ActionIconButton
                    icon="create-outline"
                    label="Renombrar"
                    onPress={() => handleRename(entry.item)}
                    backgroundColor="#32486d"
                    iconColor={colors.cream}
                  />

                  <ActionIconButton
                    icon="trash-outline"
                    label="Eliminar"
                    onPress={() => handleDelete(entry.item.id)}
                    backgroundColor="#7f1d1d"
                    iconColor="#fecaca"
                    labelColor="#fee2e2"
                  />
                </View>
              </View>
            );
          }

          return (
            <View key={entry.id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <View style={styles.itemHeaderText}>
                  <Text style={styles.itemTitle}>{entry.title}</Text>
                  <Text style={styles.itemMeta}>{entry.metaText}</Text>
                </View>

                <View style={styles.itemBadge}>
                  <Ionicons name={entry.badge.icon} size={18} color={entry.badge.color} />
                </View>
              </View>

              {entry.previewText ? <Text style={styles.itemPreview}>{entry.previewText}</Text> : null}

              <View style={styles.actionRow}>
                <ActionIconButton
                  icon="chatbubble-ellipses-outline"
                  label="Abrir"
                  onPress={() => handleTutorOpen(entry.thread)}
                  backgroundColor={colors.surfaceAlt}
                  iconColor={colors.cream}
                />

                <ActionIconButton
                  icon="share-social-outline"
                  label="Compartir"
                  onPress={() => void handleTutorShare(entry.thread)}
                  backgroundColor="#234a6e"
                  iconColor="#7dd3fc"
                />

                <ActionIconButton
                  icon="create-outline"
                  label="Renombrar"
                  onPress={() => handleTutorRename(entry.thread)}
                  backgroundColor="#32486d"
                  iconColor={colors.cream}
                />

                <ActionIconButton
                  icon="trash-outline"
                  label="Eliminar"
                  onPress={() => void handleTutorDelete(entry.thread)}
                  backgroundColor="#7f1d1d"
                  iconColor="#fecaca"
                  labelColor="#fee2e2"
                />
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* No agregamos AppBottomNav aqui: esta pantalla ya vive dentro de los tabs nativos. */}
      <RenameItemModal
        visible={renameTarget !== null}
        title={renameTarget?.kind === 'tutor' ? 'Renombrar chat' : 'Renombrar elemento'}
        initialValue={
          renameTarget?.kind === 'tutor' ? renameTarget.thread.title : renameTarget?.item.title || ''
        }
        saving={savingRename}
        onClose={() => setRenameTarget(null)}
        onSave={handleSaveRename}
      />
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: 20,
      paddingTop: 80,
    },
    content: {
      paddingBottom: 140,
    },
    title: {
      color: colors.text,
      fontSize: 34,
      fontWeight: 'bold',
      marginBottom: 10,
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: 17,
      lineHeight: 24,
      marginBottom: 24,
    },
    sortRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      gap: 10,
      marginBottom: 14,
      marginTop: 4,
      flexWrap: 'wrap',
    },
    sortChip: {
      minWidth: 88,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 999,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.creamSoft,
    },
    sortChipActive: {
      backgroundColor: colors.cream,
      borderColor: colors.cream,
    },
    sortChipText: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '700',
    },
    sortChipTextActive: {
      color: colors.accentText,
    },
    emptyCard: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.creamSoft,
    },
    emptyTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '700',
      marginBottom: 10,
    },
    emptyText: {
      color: colors.textMuted,
      fontSize: 15,
      lineHeight: 24,
    },
    itemCard: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 18,
      marginTop: 14,
      borderWidth: 1,
      borderColor: colors.creamSoft,
    },
    itemHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12,
      marginBottom: 14,
    },
    itemHeaderText: {
      flex: 1,
    },
    itemBadge: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.creamSoft,
    },
    itemTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 6,
    },
    itemMeta: {
      color: colors.textMuted,
      fontSize: 13,
      marginBottom: 14,
    },
    itemPreview: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 14,
    },
    actionRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
  });
}
