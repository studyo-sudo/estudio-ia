import { ApiError, postJson } from './apiClient';

export type TutorChatMessageInput = {
  role: 'user' | 'assistant';
  text: string;
};

export type TutorChatResponse = {
  reply: string;
  suggestedTitle?: string;
};

function truncateText(value: string, maxLength: number) {
  const text = value.trim();

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength).trim()}...`;
}

function buildFallbackTutorReply(question: string, threadTitle: string): TutorChatResponse {
  const safeQuestion = question.trim() || 'tu pregunta';
  const normalizedTitle = threadTitle.trim();
  const suggestedTitle =
    normalizedTitle && normalizedTitle !== 'Nuevo chat'
      ? normalizedTitle
      : truncateText(safeQuestion, 42) || 'Tutor';

  return {
    reply: `Claro. Puedo ayudarte con ${safeQuestion}. Si quieres, te lo explico paso a paso y luego te dejo un resumen corto para repasar.`,
    suggestedTitle,
  };
}

export async function sendTutorMessage(payload: {
  threadTitle: string;
  question: string;
  messages: TutorChatMessageInput[];
}): Promise<TutorChatResponse> {
  try {
    return await postJson<TutorChatResponse>('/tutor/chat', payload);
  } catch (error) {
    if (error instanceof ApiError && error.status < 500 && error.status !== 404) {
      throw error;
    }

    return buildFallbackTutorReply(payload.question, payload.threadTitle);
  }
}
