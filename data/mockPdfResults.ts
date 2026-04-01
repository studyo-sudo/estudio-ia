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
    'Cual es la idea principal del documento?',
    'Que conceptos son mas importantes para recordar?',
    'Como se aplica la teoria en un caso practico?',
  ],
  flashcards: [
    {
      front: 'Concepto 1',
      back: 'Definicion breve y clara del concepto.',
    },
    {
      front: 'Concepto 2',
      back: 'Explicacion rapida con contexto.',
    },
    {
      front: 'Concepto 3',
      back: 'Ejemplo aplicado para recordarlo mejor.',
    },
  ],
  exam: [
    {
      question: 'Cual es la idea principal del documento?',
      options: [
        'La idea principal del documento',
        'Un dato secundario',
        'Una opinion aislada',
        'Una referencia externa',
      ],
      correctAnswer: 'La idea principal del documento',
    },
  ],
};

export function getMockPdfResult(): PdfResultData {
  return genericResult;
}
