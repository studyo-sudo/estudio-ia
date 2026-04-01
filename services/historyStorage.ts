import AsyncStorage from '@react-native-async-storage/async-storage';
import { PdfResultData } from '../data/mockPdfResults';

const HISTORY_KEY = 'study_history_v1';

export type SavedStudyResultPayload = {
  kind: 'study-result';
  sourceType: 'pdf' | 'image' | 'audio';
  fileName: string;
  fileSize?: number;
  result: PdfResultData;
};

export type SavedExamModelPayload = {
  kind: 'exam-model';
  detectedTopics: string[];
  examStyle: string;
  estimatedQuestions: number;
  questions: {
    question: string;
    options: string[];
    correctAnswer: string;
  }[];
};

export type HistoryItem = {
  id: string;
  type: 'pdf' | 'image' | 'audio' | 'exam-model';
  title: string;
  createdAt: number;
  payload: SavedStudyResultPayload | SavedExamModelPayload;
};

export async function getHistoryItems(): Promise<HistoryItem[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveHistoryItem(item: HistoryItem): Promise<void> {
  const current = await getHistoryItems();
  const updated = [item, ...current];
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}

export async function setHistoryItems(items: HistoryItem[]): Promise<void> {
  const normalized = [...items].sort((a, b) => b.createdAt - a.createdAt);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(normalized));
}

export function mergeHistoryItems(localItems: HistoryItem[], remoteItems: HistoryItem[]) {
  const merged = new Map<string, HistoryItem>();

  for (const item of [...localItems, ...remoteItems]) {
    const previous = merged.get(item.id);

    if (!previous || item.createdAt >= previous.createdAt) {
      merged.set(item.id, item);
    }
  }

  return [...merged.values()].sort((a, b) => b.createdAt - a.createdAt);
}

export async function deleteHistoryItem(id: string): Promise<void> {
  const current = await getHistoryItems();
  const updated = current.filter((item) => item.id !== id);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}

export async function getHistoryItemById(id: string): Promise<HistoryItem | null> {
  const current = await getHistoryItems();
  return current.find((item) => item.id === id) || null;
}

export function createHistoryId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function buildShareText(item: HistoryItem): string {
  const header = `Studyo Ai\n${item.title}\n${new Date(item.createdAt).toLocaleString()}\n`;

  if (item.payload.kind === 'study-result') {
    const { sourceType, fileName, result } = item.payload;

    const questionsText = result.questions.map((q, i) => `${i + 1}. ${q}`).join('\n');
    const flashcardsText = result.flashcards
      .map((card, i) => `${i + 1}. ${card.front} -> ${card.back}`)
      .join('\n');
    const examText = result.exam
      .map(
        (q, i) =>
          `${i + 1}. ${q.question}\n- ${q.options.join('\n- ')}\nRespuesta correcta: ${q.correctAnswer}`
      )
      .join('\n\n');

    return `${header}
Tipo: ${sourceType}
Archivo: ${fileName}

RESUMEN
${result.summary}

PREGUNTAS
${questionsText}

FLASHCARDS
${flashcardsText}

EXAMEN
${examText}
`.trim();
  }

  const examQuestionsText = item.payload.questions
    .map(
      (q, i) =>
        `${i + 1}. ${q.question}\n- ${q.options.join('\n- ')}\nRespuesta correcta: ${q.correctAnswer}`
    )
    .join('\n\n');

  return `${header}
Modo: Modelo de examen

Temas detectados:
${item.payload.detectedTopics.map((topic) => `- ${topic}`).join('\n')}

Estilo detectado:
${item.payload.examStyle}

Preguntas estimadas:
${item.payload.estimatedQuestions}

EXAMEN GENERADO
${examQuestionsText}
`.trim();
}
