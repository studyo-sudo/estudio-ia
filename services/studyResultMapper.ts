import { PdfResultData } from '../data/mockPdfResults';
import { StudyAnalysisResponse } from './studyApi';

type FallbackKind = 'file' | 'image' | 'audio';

export function mapStudyAnalysisToResult(
  data: StudyAnalysisResponse,
  fallbackKind: FallbackKind
): PdfResultData {
  if (!data?.summary || typeof data.summary !== 'string') {
    throw new Error('El backend no devolvio un resumen valido.');
  }

  const fallbackQuestions =
    fallbackKind === 'file'
      ? [
          'Cual es la idea principal del archivo?',
          'Que conceptos aparecen como mas importantes?',
          'Que tema conviene estudiar primero?',
        ]
      : fallbackKind === 'image'
      ? [
          'Cual es la idea principal de la imagen?',
          'Que texto o concepto conviene memorizar?',
          'Que formula o definicion aparece?',
        ]
      : [
          'Cual fue la idea principal de la clase?',
          'Que conceptos fueron los mas importantes?',
          'Que conviene repasar primero?',
        ];

  const fallbackFlashcards =
    fallbackKind === 'audio'
      ? [
          {
            front: 'Tema principal',
            back: 'Generado desde la transcripcion del audio.',
          },
        ]
      : [
          {
            front: fallbackKind === 'image' ? 'Texto principal' : 'Idea principal',
            back:
              fallbackKind === 'image'
                ? 'Contenido detectado desde la imagen.'
                : 'Se genera a partir del contenido real del archivo.',
          },
        ];

  const fallbackExam =
    fallbackKind === 'file'
      ? [
          {
            question: 'Cual es la idea principal del archivo?',
            options: [
              'La idea principal del archivo',
              'Un detalle menor',
              'Una cita aislada',
              'Una referencia externa',
            ],
            correctAnswer: 'La idea principal del archivo',
          },
        ]
      : fallbackKind === 'image'
      ? [
          {
            question: 'Que concepto principal aparece en la imagen?',
            options: [
              'El concepto central',
              'Un detalle irrelevante',
              'Una referencia externa',
              'Nada identificable',
            ],
            correctAnswer: 'El concepto central',
          },
        ]
      : [
          {
            question: 'Cual fue el tema principal de la clase?',
            options: [
              'El tema central',
              'Un detalle irrelevante',
              'Una opinion aislada',
              'Nada importante',
            ],
            correctAnswer: 'El tema central',
          },
        ];

  return {
    summary: data.summary,
    questions: Array.isArray(data.questions) && data.questions.length > 0 ? data.questions : fallbackQuestions,
    flashcards:
      Array.isArray(data.flashcards) && data.flashcards.length > 0
        ? data.flashcards
        : fallbackFlashcards,
    exam: Array.isArray(data.exam) && data.exam.length > 0 ? data.exam : fallbackExam,
  };
}
