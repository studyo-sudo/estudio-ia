import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
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

const SCROLL_THRESHOLD = 180;

export default function TutorChatScreen() {
  const params = useLocalSearchParams<{ chatId?: string }>();
  const scrollRef = useRef<ScrollView>(null);
  const [thread, setThread] = useState<TutorChatThread | null>(null);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showJumpToBottom, setShowJumpToBottom] = useState(false);

  const chatId = typeof params.chatId === 'string' ? params.chatId : undefined;

  const scrollToBottom = useCallback((animated = true) => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated });
      setShowJumpToBottom(false);
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

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
    const distanceFromBottom =
      contentSize.height - (contentOffset.y + layoutMeasurement.height);

    setShowJumpToBottom(
      distanceFromBottom > SCROLL_THRESHOLD && contentSize.height > layoutMeasurement.height
    );
  };

  const handleContentSizeChange = useCallback(() => {
    scrollToBottom(false);
  }, [scrollToBottom]);

  const title = useMemo(() => thread?.title || 'Tutor', [thread?.title]);
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
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
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
                <Text style={styles.messageText}>{message.text}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyStage}>
            <View style={styles.emptyCard}>
              <View style={styles.emptyBadge}>
                <Ionicons name="chatbubbles-outline" size={24} color="#93c5fd" />
              </View>
              <Text style={styles.emptyLabel}>{title}</Text>
              <Text style={styles.title}>Que quieres aprender?</Text>
              <Text style={styles.subtitle}>
                Escribe una pregunta y te respondo paso a paso, con ejemplos y recursos utiles.
              </Text>
            </View>
          </View>
        )}

        <View style={styles.inputCard}>
          <TextInput
            value={question}
            onChangeText={setQuestion}
            placeholder="Escribe lo que quieres aprender..."
            placeholderTextColor="#64748b"
            style={styles.input}
            multiline
          />

          <Pressable
            style={[styles.sendButton, (!question.trim() || sending) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!question.trim() || sending}
          >
            <Text style={styles.sendButtonText}>{sending ? 'Enviando...' : 'Enviar'}</Text>
          </Pressable>
        </View>
      </ScrollView>

      {showJumpToBottom ? (
        <Pressable style={styles.jumpButtonWrapper} onPress={() => scrollToBottom(true)}>
          <View style={styles.jumpButton}>
            <Ionicons name="arrow-down" size={24} color="white" />
          </View>
        </Pressable>
      ) : null}

      <AppBottomNav activeTab="home" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  centered: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 260,
    flexGrow: 1,
  },
  emptyStage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  emptyCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#111827',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#263445',
    padding: 22,
    alignItems: 'center',
  },
  emptyBadge: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1d4ed8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyLabel: {
    color: '#93c5fd',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    textAlign: 'center',
  },
  title: {
    color: 'white',
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
    width: '100%',
  },
  subtitle: {
    color: '#cbd5e1',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    width: '100%',
  },
  chatCard: {
    gap: 12,
    marginBottom: 16,
  },
  messageBubble: {
    borderRadius: 18,
    padding: 16,
    maxWidth: '92%',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#2563eb',
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#1e293b',
  },
  messageText: {
    color: 'white',
    fontSize: 15,
    lineHeight: 22,
  },
  inputCard: {
    backgroundColor: '#111827',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#263445',
    padding: 18,
    gap: 12,
  },
  input: {
    backgroundColor: '#0f172a',
    color: 'white',
    minHeight: 96,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sendButton: {
    backgroundColor: '#7c3aed',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.72,
  },
  sendButtonText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 16,
  },
  jumpButtonWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 96,
    alignItems: 'center',
  },
  jumpButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.24,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
});
