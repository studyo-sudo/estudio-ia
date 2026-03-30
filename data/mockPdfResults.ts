export type Flashcard = {
  front: string;
  back: string;
};

export type ExamQuestion = {
  question: string;
  options: string[];
  correctAnswer: string;
};

export type PdfResultData = {
  summary: string;
  questions: string[];
  flashcards: Flashcard[];
  exam: ExamQuestion[];
};

const genericResult: PdfResultData = {
  summary:
    'El documento presenta conceptos centrales del tema, relaciones entre ideas y ejemplos importantes para estudiar y preparar un examen.',
  questions: [
    '¿Cuál es la idea principal del documento?',
    '¿Qué conceptos son más importantes para recordar?',
    '¿Cómo se aplica la teoría en un caso práctico?',
  ],
  flashcards: [
    {
      front: 'Concepto 1',
      back: 'Definición breve y clara del concepto.',
    },
    {
      front: 'Concepto 2',
      back: 'Explicación rápida con contexto.',
    },
    {
      front: 'Concepto 3',
      back: 'Ejemplo aplicado para recordarlo mejor.',
    },
  ],
  exam: [
    {
      question: '¿Cuál es la idea principal del documento?',
      options: [
        'La idea principal del documento',
        'Un dato secundario',
        'Una opinión aislada',
        'Una referencia externa',
      ],
      correctAnswer: 'La idea principal del documento',
    },
  ],
};

export function getMockPdfResult(): PdfResultData {
  return genericResult;
}