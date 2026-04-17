import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import ActionIconButton from '../components/ActionIconButton';
import AppBottomNav from '../components/AppBottomNav';
import RenameItemModal from '../components/RenameItemModal';
import { useAppPreferences } from '../contexts/AppPreferencesContext';
import {
  buildTutorShareText,
  createTutorChat,
  deleteTutorChat,
  getTutorChats,
  saveTutorChat,
  TutorChatThread,
  updateTutorChatTitle,
} from '../services/tutorChatStorage';

export default function TutorScreen() {
  const { colors, t, locale } = useAppPreferences();
  const [threads, setThreads] = useState<TutorChatThread[]>([]);
  const [renamingThread, setRenamingThread] = useState<TutorChatThread | null>(null);
  const [savingRename, setSavingRename] = useState(false);
  const [creatingChat, setCreatingChat] = useState(false);

  const styles = useMemo(() => createStyles(colors), [colors]);

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
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
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
        <Text style={styles.title}>{t('tutor.title')}</Text>
        <Text style={styles.subtitle}>{t('tutor.subtitle')}</Text>

        <Pressable
          style={[styles.newChatButton, creatingChat && styles.newChatButtonDisabled]}
          onPress={handleNewChat}
          disabled={creatingChat}
        >
          <Ionicons name="add-circle-outline" size={22} color={colors.accentText} />
          <Text style={styles.newChatButtonText}>
            {creatingChat ? t('tutor.creating') : t('tutor.newChat')}
          </Text>
        </Pressable>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('tutor.historyTitle')}</Text>
          <Text style={styles.sectionCounter}>{t('tutor.chatsCount', { count: threads.length })}</Text>
        </View>

        {threads.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>{t('tutor.noChatsTitle')}</Text>
            <Text style={styles.emptyText}>{t('tutor.noChatsText')}</Text>
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
                      {t('tutor.messageTime', {
                        count: thread.messages.length,
                        time: new Date(thread.updatedAt).toLocaleString(locale),
                      })}
                    </Text>
                  </View>

                  <View style={styles.threadBadge}>
                    <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.cream} />
                  </View>
                </View>

                {previewText ? <Text style={styles.threadPreview}>{previewText}</Text> : null}

                <View style={styles.actionRow}>
                  <ActionIconButton
                    icon="chatbubble-ellipses-outline"
                    label={t('tutor.open')}
                    onPress={() => openChat(thread)}
                    backgroundColor={colors.surfaceAlt}
                    iconColor={colors.cream}
                  />

                  <ActionIconButton
                    icon="share-social-outline"
                    label={t('tutor.share')}
                    onPress={() => void handleShare(thread)}
                    backgroundColor={colors.surfaceDeep}
                    iconColor={colors.cream}
                  />

                  <ActionIconButton
                    icon="create-outline"
                    label={t('tutor.rename')}
                    onPress={() => handleRename(thread)}
                    backgroundColor={colors.surfaceAlt}
                    iconColor={colors.cream}
                  />

                  <ActionIconButton
                    icon="trash-outline"
                    label={t('tutor.delete')}
                    onPress={() => void handleDelete(thread)}
                    backgroundColor="#7f1d1d"
                    iconColor="#fecaca"
                    labelColor="#fee2e2"
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
        title={t('tutor.rename')}
        initialValue={renamingThread?.title || ''}
        saving={savingRename}
        onClose={() => setRenamingThread(null)}
        onSave={handleSaveRename}
      />
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
      marginBottom: 20,
      textAlign: 'center',
      width: '100%',
    },
    newChatButton: {
      backgroundColor: colors.cream,
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
      color: colors.accentText,
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
      color: colors.text,
      fontSize: 22,
      fontWeight: '800',
    },
    sectionCounter: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '600',
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
    threadCard: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 18,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: colors.creamSoft,
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
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.creamSoft,
    },
    threadTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '800',
      marginBottom: 5,
    },
    threadMeta: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 18,
    },
    threadPreview: {
      color: colors.text,
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
}
