import { PdfResultData } from '../data/mockPdfResults';
import { HistoryItem } from './historyStorage';

export type StudyRouteStep = {
  title: string;
  description: string;
};

export type StudyRoute = {
  title: string;
  summary: string;
  sourceLabel: string;
  sourceName: string;
  updatedAt: number;
  steps: StudyRouteStep[];
  nextAction: string;
};

function truncate(value: string, maxLength: number) {
  const normalized = value.trim().replace(/\s+/g, ' ');

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trim()}...`;
}

function buildRouteFromResult(
  result: PdfResultData,
  sourceLabel: string,
  sourceName: string,
  updatedAt: number
): StudyRoute {
  const questionHighlights = result.questions.slice(0, 3);
  const flashcardHighlights = result.flashcards.slice(0, 3).map((card) => card.front);

  return {
    title: `Ruta de estudio para ${sourceLabel.toLowerCase()}`,
    summary: truncate(result.summary, 180),
    sourceLabel,
    sourceName,
    updatedAt,
    nextAction: 'Empieza por el resumen, luego repasa las flashcards y termina con el examen.',
    steps: [
      {
        title: 'Lee el resumen una vez',
        description: truncate(result.summary, 160),
      },
      {
        title: 'Marca 3 ideas clave',
        description:
          questionHighlights.length > 0
            ? questionHighlights.join(' • ')
            : 'Busca las ideas que más se repiten en el contenido.',
      },
      {
        title: 'Repasa flashcards',
        description:
          flashcardHighlights.length > 0
            ? `Primero: ${flashcardHighlights.join(' • ')}`
            : 'Haz una pasada rápida por las tarjetas creadas.',
      },
      {
        title: 'Haz el examen',
        description: `Practica con ${result.exam.length} preguntas para comprobar lo que recuerdas.`,
      },
      {
        title: 'Explica en voz alta',
        description: 'Si puedes explicarlo sin mirar, ya lo estás entendiendo de verdad.',
      },
    ],
  };
}

function buildRouteFromExamModel(item: HistoryItem): StudyRoute {
  if (item.payload.kind !== 'exam-model') {
    throw new Error('Item invalido para la ruta de estudio.');
  }

  return {
    title: 'Ruta de estudio para examen',
    summary: truncate(item.payload.examStyle, 180),
    sourceLabel: 'Modelo de examen',
    sourceName: item.title,
    updatedAt: item.createdAt,
    nextAction: 'Primero mira los temas detectados, después resuelve el examen y corrige errores.',
    steps: [
      {
        title: 'Revisa los temas detectados',
        description: item.payload.detectedTopics.join(' • ') || 'Repasa los temas más repetidos.',
      },
      {
        title: 'Resuelve el examen generado',
        description: `Tienes ${item.payload.questions.length} preguntas para practicar.`,
      },
      {
        title: 'Corrige lo que falles',
        description: 'Vuelve sobre las preguntas incorrectas y busca la idea que te faltó.',
      },
      {
        title: 'Pregunta al Tutor',
        description: 'Si algo no te cierra, abre Tutor y pide una explicación paso a paso.',
      },
    ],
  };
}

export function buildStudyRouteFromHistory(items: HistoryItem[]): StudyRoute | null {
  const latestItem = [...items].sort((a, b) => b.createdAt - a.createdAt)[0];

  if (!latestItem) {
    return null;
  }

  if (latestItem.payload.kind === 'study-result') {
    return buildRouteFromResult(
      latestItem.payload.result,
      latestItem.type === 'file' ? 'archivo' : latestItem.type,
      latestItem.title,
      latestItem.createdAt
    );
  }

  return buildRouteFromExamModel(latestItem);
}

export function buildStudyRouteFromCurrentResult(
  result: PdfResultData,
  sourceType: 'file' | 'image' | 'audio',
  sourceName: string,
  updatedAt: number
) {
  const sourceLabel =
    sourceType === 'file' ? 'archivo' : sourceType === 'image' ? 'imagen' : 'audio';

  return buildRouteFromResult(result, sourceLabel, sourceName, updatedAt);
}
