import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppBottomNav from '../components/AppBottomNav';
import { useAppPreferences } from '../contexts/AppPreferencesContext';
import {
  buildTutorChatTitle,
  createTutorChat,
  getTutorChatById,
  saveTutorChat,
  TutorChatMessage,
  TutorChatThread,
} from '../services/tutorChatStorage';
import { sendTutorMessage } from '../services/tutorApi';

const COMPOSER_BOTTOM_OFFSET = 104;
const CONTENT_BOTTOM_PADDING = 220;

export default function TutorChatScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ chatId?: string }>();
  const { colors, t } = useAppPreferences();
  const scrollRef = useRef<ScrollView>(null);
  const [thread, setThread] = useState<TutorChatThread | null>(null);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const styles = useMemo(() => createStyles(colors), [colors]);

  const chatId = typeof params.chatId === 'string' ? params.chatId : undefined;
  const composerBottom = COMPOSER_BOTTOM_OFFSET + insets.bottom;

  const scrollToBottom = useCallback((animated = true) => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated });
    });
  }, []);

  const loadThread = useCallback(async () => {
    setLoading(true);

    if (!chatId) {
      const created = createTutorChat();
      await saveTutorChat(created);
      setThread(created);
      setLoading(false);
      router.replace({
        pathname: '/tutor-chat',
        params: { chatId: created.id },
      } as never);
      return;
    }

    const found = await getTutorChatById(chatId);

    if (!found) {
      const created = createTutorChat();
      await saveTutorChat(created);
      setThread(created);
      setLoading(false);
      router.replace({
        pathname: '/tutor-chat',
        params: { chatId: created.id },
      } as never);
      return;
    }

    setThread(found);
    setLoading(false);
  }, [chatId]);

  useFocusEffect(
    useCallback(() => {
      void loadThread();
    }, [loadThread])
  );

  const threadId = thread?.id;
  const messageCount = thread?.messages.length ?? 0;

  useEffect(() => {
    if (!threadId) {
      return;
    }

    scrollToBottom(false);
  }, [messageCount, scrollToBottom, threadId]);

  const persistThread = useCallback(async (nextThread: TutorChatThread) => {
    await saveTutorChat(nextThread);
    setThread(nextThread);
  }, []);

  const handleSend = async () => {
    const trimmed = question.trim();

    if (!trimmed || !thread || sending) {
      return;
    }

    let threadWithUserMessage: TutorChatThread | null = null;

    try {
      setSending(true);

      const now = Date.now();
      const isNewChat = thread.title === 'Nuevo chat';
      const nextTitle = isNewChat ? buildTutorChatTitle(trimmed) : thread.title;
      const userMessage: TutorChatMessage = {
        id: `${now}-user`,
        role: 'user',
        text: trimmed,
        createdAt: now,
      };

      threadWithUserMessage = {
        ...thread,
        title: nextTitle,
        updatedAt: now,
        messages: [...thread.messages, userMessage],
      };

      setThread(threadWithUserMessage);
      setQuestion('');
      await saveTutorChat(threadWithUserMessage);
      scrollToBottom(true);

      const tutorResponse = await sendTutorMessage({
        threadTitle: threadWithUserMessage.title,
        question: trimmed,
        messages: threadWithUserMessage.messages.map((message) => ({
          role: message.role,
          text: message.text,
        })),
      });

      const assistantMessage: TutorChatMessage = {
        id: `${now}-assistant`,
        role: 'assistant',
        text:
          typeof tutorResponse.reply === 'string' && tutorResponse.reply.trim().length > 0
            ? tutorResponse.reply.trim()
            : t('tutor.sendError'),
        createdAt: now + 1,
      };

      const nextThread: TutorChatThread = {
        ...threadWithUserMessage,
        title: isNewChat
          ? tutorResponse.suggestedTitle || threadWithUserMessage.title
          : threadWithUserMessage.title,
        updatedAt: now,
        messages: [...threadWithUserMessage.messages, assistantMessage],
      };

      await persistThread(nextThread);
      scrollToBottom(true);
    } catch (error) {
      console.error('Error enviando mensaje al tutor:', error);
      const message =
        error instanceof Error ? error.message : t('tutor.sendError');
      if (threadWithUserMessage) {
        const fallbackThread: TutorChatThread = {
          ...threadWithUserMessage,
          updatedAt: Date.now(),
          messages: [
            ...threadWithUserMessage.messages,
            {
              id: `${Date.now()}-assistant-error`,
              role: 'assistant',
              text: message,
              createdAt: Date.now(),
            },
          ],
        };

        await saveTutorChat(fallbackThread);
        setThread(fallbackThread);
        scrollToBottom(true);
      }

      Alert.alert('Error', message);
    } finally {
      setSending(false);
    }
  };

  const handleContentSizeChange = useCallback(() => {
    scrollToBottom(false);
  }, [scrollToBottom]);

  const title = useMemo(() => thread?.title || t('tutor.newChatPrompt'), [t, thread?.title]);
  const hasMessages = (thread?.messages.length ?? 0) > 0;

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>{t('tutor.loading')}</Text>
      </View>
    );
  }

  if (!thread) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>{t('tutor.notFound')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: CONTENT_BOTTOM_PADDING + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={handleContentSizeChange}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        {hasMessages ? (
          <View style={styles.chatCard}>
            {thread.messages.map((message) => (
              <View
                key={message.id}
                style={[
                  styles.messageBubble,
                  message.role === 'user' ? styles.userBubble : styles.assistantBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    message.role === 'user'
                      ? styles.userMessageText
                      : styles.assistantMessageText,
                  ]}
                >
                  {message.text}
                </Text>
              </View>
            ))}
            {sending ? (
              <View style={[styles.messageBubble, styles.assistantBubble, styles.typingBubble]}>
                <View style={styles.typingDots}>
                  <View style={styles.typingDot} />
                  <View style={styles.typingDot} />
                  <View style={styles.typingDot} />
                </View>
              </View>
            ) : null}
          </View>
        ) : (
          <View style={styles.emptyStage}>
            <View style={styles.emptyBadge}>
              <Ionicons name="sparkles-outline" size={22} color={colors.text} />
            </View>
            <Text style={styles.emptyLabel}>{title}</Text>
            <Text style={styles.emptyTitle}>{t('tutor.emptyTitle')}</Text>
            <Text style={styles.emptySubtitle}>{t('tutor.emptySubtitle')}</Text>
          </View>
        )}
      </ScrollView>

      <View style={[styles.composerDock, { bottom: composerBottom }]}>
        <View style={styles.composerCard}>
          <TextInput
            value={question}
            onChangeText={setQuestion}
            placeholder={t('tutor.inputPlaceholder')}
            placeholderTextColor={colors.textMuted}
            style={styles.composerInput}
            multiline
          />

          <Pressable
            style={[styles.sendButton, (!question.trim() || sending) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!question.trim() || sending}
          >
            <Ionicons name="arrow-up" size={22} color={colors.accentText} />
          </Pressable>
        </View>
      </View>

      <AppBottomNav activeTab="home" />
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useAppPreferences>['colors']) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centered: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    loadingText: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '700',
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flexGrow: 1,
      paddingHorizontal: 20,
      paddingTop: 24,
    },
    chatCard: {
      gap: 12,
      paddingBottom: 12,
    },
    messageBubble: {
      borderRadius: 18,
      padding: 16,
      maxWidth: '92%',
    },
    userBubble: {
      alignSelf: 'flex-end',
      backgroundColor: colors.surfaceDeep,
    },
    assistantBubble: {
      alignSelf: 'flex-start',
      backgroundColor: colors.surface,
    },
    typingBubble: {
      minWidth: 72,
      paddingVertical: 14,
    },
    messageText: {
      fontSize: 15,
      lineHeight: 22,
    },
    userMessageText: {
      color: colors.text,
    },
    assistantMessageText: {
      color: colors.text,
    },
    emptyStage: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 48,
      paddingHorizontal: 12,
    },
    emptyBadge: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.creamSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 18,
    },
    emptyLabel: {
      color: colors.text,
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginBottom: 10,
      textAlign: 'center',
    },
    emptyTitle: {
      color: colors.text,
      fontSize: 31,
      fontWeight: '800',
      lineHeight: 38,
      textAlign: 'center',
      marginBottom: 10,
    },
    emptySubtitle: {
      color: colors.textMuted,
      fontSize: 16,
      lineHeight: 24,
      textAlign: 'center',
      maxWidth: 360,
    },
    composerDock: {
      position: 'absolute',
      left: 16,
      right: 16,
      zIndex: 10,
      elevation: 10,
    },
    composerCard: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 12,
      backgroundColor: colors.surface,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: colors.creamSoft,
      paddingHorizontal: 14,
      paddingVertical: 12,
      shadowColor: colors.shadow,
      shadowOpacity: 0.22,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
    },
    composerInput: {
      flex: 1,
      minHeight: 24,
      maxHeight: 120,
      color: colors.text,
      fontSize: 16,
      lineHeight: 22,
      paddingHorizontal: 6,
      paddingVertical: 10,
      textAlignVertical: 'top',
    },
    sendButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.cream,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendButtonDisabled: {
      opacity: 0.72,
    },
    typingDots: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    typingDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.textMuted,
      opacity: 0.85,
    },
  });
}
