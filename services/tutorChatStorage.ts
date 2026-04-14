import AsyncStorage from '@react-native-async-storage/async-storage';

const TUTOR_CHAT_STORAGE_KEY = 'study_tutor_chats_v1';

export type TutorChatRole = 'user' | 'assistant';

export type TutorChatMessage = {
  id: string;
  role: TutorChatRole;
  text: string;
  createdAt: number;
};

export type TutorChatThread = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: TutorChatMessage[];
};

const EMPTY_CHAT_SHARE_TEXT = 'Sin mensajes todavia.';

function createTutorChatId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeChatTitle(title: string) {
  const normalized = title.trim().replace(/\s+/g, ' ');

  if (!normalized) {
    throw new Error('El nombre no puede estar vacio.');
  }

  return normalized;
}

function isThreadCandidate(value: unknown): value is TutorChatThread {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const thread = value as TutorChatThread;

  return (
    typeof thread.id === 'string' &&
    typeof thread.title === 'string' &&
    typeof thread.createdAt === 'number' &&
    typeof thread.updatedAt === 'number' &&
    Array.isArray(thread.messages)
  );
}

async function readStoredThreads(): Promise<TutorChatThread[]> {
  try {
    const raw = await AsyncStorage.getItem(TUTOR_CHAT_STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isThreadCandidate).map((thread) => ({
      ...thread,
      messages: Array.isArray(thread.messages) ? thread.messages : [],
    }));
  } catch {
    return [];
  }
}

async function writeStoredThreads(threads: TutorChatThread[]) {
  const normalized = [...threads].sort((a, b) => b.updatedAt - a.updatedAt);
  await AsyncStorage.setItem(TUTOR_CHAT_STORAGE_KEY, JSON.stringify(normalized));
}

export function createTutorChat(title = 'Nuevo chat'): TutorChatThread {
  const now = Date.now();
  const id = createTutorChatId();

  return {
    id,
    title,
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
}

export function buildTutorChatTitle(prompt: string) {
  const normalized = prompt.trim().replace(/\s+/g, ' ');

  if (!normalized) {
    return 'Nuevo chat';
  }

  return normalized.length > 42 ? `${normalized.slice(0, 42).trim()}...` : normalized;
}

export async function getTutorChats(): Promise<TutorChatThread[]> {
  const threads = await readStoredThreads();
  return threads.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getTutorChatById(id: string): Promise<TutorChatThread | null> {
  const threads = await readStoredThreads();
  return threads.find((thread) => thread.id === id) || null;
}

export async function saveTutorChat(thread: TutorChatThread): Promise<void> {
  const threads = await readStoredThreads();
  const nextThreads = threads.some((item) => item.id === thread.id)
    ? threads.map((item) => (item.id === thread.id ? thread : item))
    : [thread, ...threads];

  await writeStoredThreads(nextThreads);
}

export async function updateTutorChatTitle(id: string, title: string): Promise<TutorChatThread | null> {
  const normalizedTitle = normalizeChatTitle(title);
  const threads = await readStoredThreads();
  let updatedThread: TutorChatThread | null = null;

  const nextThreads = threads.map((thread) => {
    if (thread.id !== id) {
      return thread;
    }

    updatedThread = {
      ...thread,
      title: normalizedTitle,
      updatedAt: Date.now(),
    };

    return updatedThread;
  });

  if (!updatedThread) {
    return null;
  }

  await writeStoredThreads(nextThreads);
  return updatedThread;
}

export async function deleteTutorChat(id: string): Promise<void> {
  const threads = await readStoredThreads();
  const nextThreads = threads.filter((thread) => thread.id !== id);
  await writeStoredThreads(nextThreads);
}

export function buildTutorShareText(thread: TutorChatThread): string {
  const header = `Studyo Ai Tutor\n${thread.title}\n${new Date(thread.updatedAt).toLocaleString()}\n`;

  const transcript = thread.messages
    .map((message, index) => {
      const label = message.role === 'user' ? 'Usuario' : 'Tutor';
      return `${index + 1}. ${label}: ${message.text}`;
    })
    .join('\n\n');

  return `${header}\n${transcript || EMPTY_CHAT_SHARE_TEXT}`.trim();
}
