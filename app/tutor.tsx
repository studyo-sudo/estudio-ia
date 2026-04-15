import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import ActionIconButton from '../components/ActionIconButton';
import AppBottomNav from '../components/AppBottomNav';
import RenameItemModal from '../components/RenameItemModal';
import { APP_COLORS } from '../constants/theme';
import {
  buildTutorShareText,
  deleteTutorChat,
  getTutorChats,
  saveTutorChat,
  TutorChatThread,
  updateTutorChatTitle,
  createTutorChat,
} from '../services/tutorChatStorage';

export default function TutorScreen() {
  const [threads, setThreads] = useState<TutorChatThread[]>([]);
  const [renamingThread, setRenamingThread] = useState<TutorChatThread | null>(null);
  const [savingRename, setSavingRename] = useState(false);
  const [creatingChat, setCreatingChat] = useState(false);

  const loadThreads = useCallback(async () => {
    const chats = await getTutorChats();
    setThreads(chats);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadThreads();
    }, [loadThreads])
  );

  const openChat = (thread: TutorChatThread) => {
    router.push({
      pathname: '/tutor-chat',
      params: { chatId: thread.id },
    } as never);
  };

  const handleNewChat = async () => {
    try {
      setCreatingChat(true);
      const thread = createTutorChat();
      await saveTutorChat(thread);
      await loadThreads();
      router.push({
        pathname: '/tutor-chat',
        params: { chatId: thread.id },
      } as never);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo crear el chat.';
      Alert.alert('Error', message);
    } finally {
      setCreatingChat(false);
    }
  };

  const handleShare = async (thread: TutorChatThread) => {
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

  const handleDelete = async (thread: TutorChatThread) => {
    const confirmDelete = async () => {
      await deleteTutorChat(thread.id);
      await loadThreads();
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

  const handleRename = (thread: TutorChatThread) => {
    setRenamingThread(thread);
  };

  const handleSaveRename = async (value: string) => {
    if (!renamingThread) {
      return;
    }

    try {
      setSavingRename(true);
      const updated = await updateTutorChatTitle(renamingThread.id, value);

      if (updated) {
        setRenamingThread(null);
        await loadThreads();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo renombrar el chat.';
      Alert.alert('Error renombrando', message);
    } finally {
      setSavingRename(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Tutor</Text>
        <Text style={styles.subtitle}>
          Abre un chat nuevo o entra a uno anterior para seguir preguntando sobre cualquier tema.
        </Text>

        <Pressable
          style={[styles.newChatButton, creatingChat && styles.newChatButtonDisabled]}
          onPress={handleNewChat}
          disabled={creatingChat}
        >
          <Ionicons name="add-circle-outline" size={22} color="white" />
          <Text style={styles.newChatButtonText}>
            {creatingChat ? 'Creando...' : 'Nuevo chat'}
          </Text>
        </Pressable>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Historial de chats</Text>
          <Text style={styles.sectionCounter}>{threads.length} chats</Text>
        </View>

        {threads.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Todavia no hay chats guardados</Text>
            <Text style={styles.emptyText}>
              Toca en Nuevo chat para empezar una conversación con Tutor.
            </Text>
          </View>
        ) : (
          threads.map((thread) => {
            const previewMessage = thread.messages[thread.messages.length - 1]?.text || '';
            const previewText =
              previewMessage.length > 92 ? `${previewMessage.slice(0, 92).trim()}…` : previewMessage;

            return (
              <View key={thread.id} style={styles.threadCard}>
                <View style={styles.threadHeader}>
                  <View style={styles.threadHeaderText}>
                    <Text style={styles.threadTitle}>{thread.title}</Text>
                    <Text style={styles.threadMeta}>
                      {thread.messages.length} mensajes · {new Date(thread.updatedAt).toLocaleString()}
                    </Text>
                  </View>

                  <View style={styles.threadBadge}>
                    <Ionicons name="chatbubble-ellipses-outline" size={16} color="#7dd3fc" />
                  </View>
                </View>

                {previewText ? <Text style={styles.threadPreview}>{previewText}</Text> : null}

                <View style={styles.actionRow}>
                  <ActionIconButton
                    icon="chatbubble-ellipses-outline"
                    label="Abrir"
                    onPress={() => openChat(thread)}
                    backgroundColor={APP_COLORS.surfaceAlt}
                  />

                  <ActionIconButton
                    icon="share-social-outline"
                    label="Compartir"
                    onPress={() => void handleShare(thread)}
                    backgroundColor={APP_COLORS.surfaceAlt}
                  />

                  <ActionIconButton
                    icon="create-outline"
                    label="Renombrar"
                    onPress={() => handleRename(thread)}
                    backgroundColor={APP_COLORS.surfaceAlt}
                  />

                  <ActionIconButton
                    icon="trash-outline"
                    label="Eliminar"
                    onPress={() => void handleDelete(thread)}
                    backgroundColor={APP_COLORS.surfaceAlt}
                  />
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <AppBottomNav activeTab="home" />

      <RenameItemModal
        visible={renamingThread !== null}
        title="Renombrar chat"
        initialValue={renamingThread?.title || ''}
        saving={savingRename}
        onClose={() => setRenamingThread(null)}
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
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 260,
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
    marginBottom: 20,
    textAlign: 'center',
    width: '100%',
  },
  newChatButton: {
    backgroundColor: APP_COLORS.text,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 22,
  },
  newChatButtonDisabled: {
    opacity: 0.72,
  },
  newChatButtonText: {
    color: APP_COLORS.accentText,
    fontSize: 16,
    fontWeight: '800',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    color: APP_COLORS.text,
    fontSize: 22,
    fontWeight: '800',
  },
  sectionCounter: {
    color: APP_COLORS.textMuted,
    fontSize: 13,
    fontWeight: '600',
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
  threadCard: {
    backgroundColor: APP_COLORS.surface,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: APP_COLORS.creamSoft,
  },
  threadHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  threadHeaderText: {
    flex: 1,
  },
  threadBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: APP_COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: APP_COLORS.creamSoft,
  },
  threadTitle: {
    color: APP_COLORS.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 5,
  },
  threadMeta: {
    color: APP_COLORS.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  threadPreview: {
    color: APP_COLORS.text,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 12,
    marginBottom: 14,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
});
