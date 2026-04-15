import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppBottomNav from '../components/AppBottomNav';
import {
  buildTutorChatTitle,
  createTutorChat,
  getTutorChatById,
  saveTutorChat,
  TutorChatMessage,
  TutorChatThread,
} from '../services/tutorChatStorage';
import { sendTutorMessage } from '../services/tutorApi';
import { APP_COLORS } from '../constants/theme';

const COMPOSER_BOTTOM_OFFSET = 88;
const CONTENT_BOTTOM_PADDING = 220;

export default function TutorChatScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ chatId?: string }>();
  const scrollRef = useRef<ScrollView>(null);
  const [thread, setThread] = useState<TutorChatThread | null>(null);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

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

    if (!trimmed || !thread) {
      return;
    }

    try {
      setSending(true);

      const now = Date.now();
      const userMessage: TutorChatMessage = {
        id: `${now}-user`,
        role: 'user',
        text: trimmed,
        createdAt: now,
      };

      const tutorResponse = await sendTutorMessage({
        threadTitle: thread.title,
        question: trimmed,
        messages: [...thread.messages, userMessage].map((message) => ({
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
            : 'No pude generar una respuesta en este momento.',
        createdAt: now + 1,
      };

      const nextTitle =
        thread.title === 'Nuevo chat'
          ? tutorResponse.suggestedTitle || buildTutorChatTitle(trimmed)
          : thread.title;

      const nextThread: TutorChatThread = {
        ...thread,
        title: nextTitle,
        updatedAt: now,
        messages: [...thread.messages, userMessage, assistantMessage],
      };

      await persistThread(nextThread);
      setQuestion('');
      scrollToBottom(true);
    } catch (error) {
      console.error('Error enviando mensaje al tutor:', error);
      const message =
        error instanceof Error ? error.message : 'No se pudo generar una respuesta.';
      Alert.alert('Error', message);
    } finally {
      setSending(false);
    }
  };

  const handleContentSizeChange = useCallback(() => {
    scrollToBottom(false);
  }, [scrollToBottom]);

  const title = useMemo(() => thread?.title || 'Nuevo chat', [thread?.title]);
  const hasMessages = (thread?.messages.length ?? 0) > 0;

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>Cargando chat...</Text>
      </View>
    );
  }

  if (!thread) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>No se pudo abrir este chat.</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: CONTENT_BOTTOM_PADDING + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={handleContentSizeChange}
        scrollEventThrottle={16}
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
          </View>
        ) : (
          <View style={styles.emptyStage}>
            <View style={styles.emptyBadge}>
              <Ionicons name="sparkles-outline" size={22} color={APP_COLORS.text} />
            </View>
            <Text style={styles.emptyLabel}>{title}</Text>
            <Text style={styles.emptyTitle}>Que quieres aprender?</Text>
            <Text style={styles.emptySubtitle}>
              Escribe una pregunta y te respondo paso a paso, con ejemplos y recursos utiles.
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={[styles.composerDock, { bottom: composerBottom }]}>
        <View style={styles.composerCard}>
          <TextInput
            value={question}
            onChangeText={setQuestion}
            placeholder="Escribe lo que quieres aprender..."
            placeholderTextColor={APP_COLORS.textMuted}
            style={styles.composerInput}
            multiline
          />

          <Pressable
            style={[styles.sendButton, (!question.trim() || sending) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!question.trim() || sending}
          >
            <Ionicons name="arrow-up" size={22} color={APP_COLORS.accentText} />
          </Pressable>
        </View>
      </View>

      <AppBottomNav activeTab="home" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
  },
  centered: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    color: APP_COLORS.text,
    fontSize: 18,
    fontWeight: '700',
  },
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
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
    backgroundColor: APP_COLORS.surfaceDeep,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: APP_COLORS.surface,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userMessageText: {
    color: APP_COLORS.text,
  },
  assistantMessageText: {
    color: APP_COLORS.text,
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
    backgroundColor: APP_COLORS.surface,
    borderWidth: 1,
    borderColor: APP_COLORS.creamSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  emptyLabel: {
    color: APP_COLORS.text,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyTitle: {
    color: APP_COLORS.text,
    fontSize: 31,
    fontWeight: '800',
    lineHeight: 38,
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySubtitle: {
    color: APP_COLORS.textMuted,
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
    backgroundColor: APP_COLORS.surface,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: APP_COLORS.creamSoft,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: APP_COLORS.shadow,
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  composerInput: {
    flex: 1,
    minHeight: 24,
    maxHeight: 120,
    color: APP_COLORS.text,
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
    backgroundColor: APP_COLORS.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.72,
  },
});
