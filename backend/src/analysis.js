const OpenAI = require('openai');
const { toFile } = require('openai');
const { openaiApiKey, openaiModel } = require('./config');

let client = null;

function getClient() {
  if (!openaiApiKey) {
    return null;
  }

  if (!client) {
    client = new OpenAI({
      apiKey: openaiApiKey,
    });
  }

  return client;
}

function buildQuestions(subject) {
  return [
    `Cual es la idea principal de ${subject}?`,
    `Que conceptos de ${subject} conviene repasar primero?`,
    `Que aplicacion practica aparece en ${subject}?`,
  ];
}

function buildFlashcards(subject) {
  return [
    {
      front: `Tema central de ${subject}`,
      back: `Resumen clave generado a partir de ${subject}.`,
    },
    {
      front: `Concepto importante`,
      back: `Punto para memorizar del material ${subject}.`,
    },
  ];
}

function buildExam(subject) {
  return [
    {
      question: `Cual es la idea principal de ${subject}?`,
      options: [
        `El concepto central de ${subject}`,
        'Un detalle menor',
        'Una referencia externa',
        'Nada relevante',
      ],
      correctAnswer: `El concepto central de ${subject}`,
    },
  ];
}

function buildStudyAnalysis(kind, fileName) {
  const normalizedName = fileName || kind;
  const subject =
    kind === 'audio'
      ? `la clase "${normalizedName}"`
      : kind === 'image'
      ? `la imagen "${normalizedName}"`
      : `el archivo "${normalizedName}"`;

  return {
    summary: `Analisis inicial generado para ${subject}. Este backend starter devuelve contenido estructurado compatible con la app mientras se integra el motor real de IA.`,
    questions: buildQuestions(subject),
    flashcards: buildFlashcards(subject),
    exam: buildExam(subject),
  };
}

function extractJsonObject(text) {
  const raw = String(text || '').trim();

  try {
    return JSON.parse(raw);
  } catch {}

  const firstBrace = raw.indexOf('{');
  const lastBrace = raw.lastIndexOf('}');

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error('No se recibio un JSON valido desde OpenAI.');
  }

  return JSON.parse(raw.slice(firstBrace, lastBrace + 1));
}

function normalizeStudyAnalysis(data, fallbackKind, fileName) {
  const fallback = buildStudyAnalysis(fallbackKind, fileName);

  return {
    summary:
      typeof data?.summary === 'string' && data.summary.trim().length > 0
        ? data.summary.trim()
        : fallback.summary,
    questions:
      Array.isArray(data?.questions) && data.questions.length > 0
        ? data.questions.slice(0, 5).map((value) => String(value))
        : fallback.questions,
    flashcards:
      Array.isArray(data?.flashcards) && data.flashcards.length > 0
        ? data.flashcards.slice(0, 6).map((item) => ({
            front: String(item?.front || 'Concepto'),
            back: String(item?.back || 'Resumen'),
          }))
        : fallback.flashcards,
    exam:
      Array.isArray(data?.exam) && data.exam.length > 0
        ? data.exam.slice(0, 4).map((item) => ({
            question: String(item?.question || 'Pregunta'),
            options: Array.isArray(item?.options)
              ? item.options.slice(0, 4).map((value) => String(value))
              : ['Opcion A', 'Opcion B', 'Opcion C', 'Opcion D'],
            correctAnswer: String(item?.correctAnswer || 'Opcion A'),
          }))
        : fallback.exam,
  };
}

async function createStructuredStudyAnalysis(inputContent, fallbackKind, fileName) {
  const sdk = getClient();

  if (!sdk) {
    return buildStudyAnalysis(fallbackKind, fileName);
  }

  const response = await sdk.responses.create({
    model: openaiModel,
    input: [
      {
        role: 'system',
        content: [
          {
            type: 'input_text',
            text:
              'Devuelve solo JSON valido con esta forma exacta: {"summary":"string","questions":["string"],"flashcards":[{"front":"string","back":"string"}],"exam":[{"question":"string","options":["string","string","string","string"],"correctAnswer":"string"}]}. Resume de forma clara, crea entre 3 y 5 preguntas, entre 3 y 6 flashcards y entre 2 y 4 preguntas tipo examen.',
          },
        ],
      },
      {
        role: 'user',
        content: inputContent,
      },
    ],
  });

  return normalizeStudyAnalysis(extractJsonObject(response.output_text), fallbackKind, fileName);
}

async function analyzeTextFile(buffer, fileName) {
  const rawText = buffer.toString('utf8').trim();

  if (!rawText) {
    return buildStudyAnalysis('file', fileName);
  }

  return createStructuredStudyAnalysis(
    [
      {
        type: 'input_text',
        text: `Analiza este archivo de estudio llamado "${fileName}" y genera contenido realmente util para estudiar.\n\nContenido:\n${rawText.slice(0, 12000)}`,
      },
    ],
    'file',
    fileName
  );
}

async function analyzeImageBuffer(buffer, mimeType, fileName) {
  return createStructuredStudyAnalysis(
    [
      {
        type: 'input_text',
        text: `Analiza esta imagen de estudio llamada "${fileName}". Extrae texto, conceptos, formulas e ideas importantes y genera material para estudiar.`,
      },
      {
        type: 'input_image',
        image_url: `data:${mimeType || 'image/jpeg'};base64,${buffer.toString('base64')}`,
      },
    ],
    'image',
    fileName
  );
}

async function analyzeAudioBuffer(buffer, mimeType, fileName) {
  const sdk = getClient();

  if (!sdk) {
    return buildStudyAnalysis('audio', fileName);
  }

  const transcript = await sdk.audio.transcriptions.create({
    file: await toFile(buffer, fileName, {
      type: mimeType || 'audio/webm',
    }),
    model: 'gpt-4o-mini-transcribe',
  });

  return createStructuredStudyAnalysis(
    [
      {
        type: 'input_text',
        text: `Analiza esta transcripcion de audio llamada "${fileName}" y genera material realmente util para estudiar.\n\nTranscripcion:\n${String(transcript.text || '').slice(0, 12000)}`,
      },
    ],
    'audio',
    fileName
  );
}

function buildExamModelAnalysis(fileNames) {
  const total = fileNames.length;
  return {
    detectedTopics: [
      'Tema principal detectado',
      'Conceptos recurrentes',
      'Formato de evaluacion',
    ],
    examStyle: `Se analizaron ${total} imagenes y se detecto un estilo de examen teorico-practico con foco en conceptos clave.`,
    estimatedQuestions: Math.max(5, total * 5),
    generatedExam: {
      questions: [
        {
          question: 'Cual fue el patron principal detectado en los examenes?',
          options: [
            'Preguntas conceptuales y aplicadas',
            'Solo definiciones sueltas',
            'Contenido sin estructura',
            'Preguntas aleatorias',
          ],
          correctAnswer: 'Preguntas conceptuales y aplicadas',
        },
      ],
    },
  };
}

module.exports = {
  analyzeAudioBuffer,
  analyzeImageBuffer,
  analyzeTextFile,
  buildStudyAnalysis,
  buildExamModelAnalysis,
};
