const OpenAI = require('openai');
const { toFile } = require('openai');
const pdfParse = require('pdf-parse');
const { openaiApiKey, openaiModel, openaiPdfModel } = require('./config');

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

async function createStructuredStudyAnalysis(
  inputContent,
  fallbackKind,
  fileName,
  modelOverride = openaiModel
) {
  const sdk = getClient();

  if (!sdk) {
    return buildStudyAnalysis(fallbackKind, fileName);
  }

  const response = await sdk.responses.create({
    model: modelOverride,
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

function normalizeFileName(fileName) {
  const raw = String(fileName || 'archivo');

  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

async function analyzeTextFile(buffer, fileName) {
  const safeFileName = normalizeFileName(fileName);
  const normalizedName = safeFileName.toLowerCase();
  let rawText = '';

  if (normalizedName.endsWith('.pdf')) {
    const sdk = getClient();

    if (sdk) {
      try {
        const uploaded = await sdk.files.create({
          file: await toFile(buffer, safeFileName, {
            type: 'application/pdf',
          }),
          purpose: 'user_data',
        });

        return createStructuredStudyAnalysis(
          [
            {
              type: 'input_file',
              file_id: uploaded.id,
            },
            {
              type: 'input_text',
              text: `Analiza este PDF de estudio llamado "${safeFileName}" y genera material realmente util para estudiar. Devuelve resumen, preguntas, flashcards y examen usando tanto el texto como los elementos visuales del PDF.`,
            },
          ],
          'file',
          safeFileName,
          openaiPdfModel
        );
      } catch (error) {
        console.error('Error analizando PDF como archivo con OpenAI:', error);
      }
    }
  }

  if (normalizedName.endsWith('.pdf')) {
    const parsed = await pdfParse(buffer);
    rawText = String(parsed.text || '').trim();
  } else {
    rawText = buffer.toString('utf8').trim();
  }

  if (!rawText) {
    return buildStudyAnalysis('file', safeFileName);
  }

  return createStructuredStudyAnalysis(
    [
      {
        type: 'input_text',
        text: `Analiza este archivo de estudio llamado "${safeFileName}" y genera contenido realmente util para estudiar.\n\nContenido:\n${rawText.slice(0, 12000)}`,
      },
    ],
    'file',
    safeFileName
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

function truncateText(value, maxLength) {
  const text = String(value || '').trim();

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength).trim()}...`;
}

function normalizeTutorMessages(messages) {
  if (!Array.isArray(messages)) {
    return [];
  }

  return messages
    .filter((message) => message && typeof message === 'object')
    .map((message) => ({
      role: message.role === 'assistant' ? 'assistant' : 'user',
      text: String(message.text || '').trim(),
    }))
    .filter((message) => message.text.length > 0)
    .slice(-12);
}

function buildTutorFallbackReply(question, threadTitle) {
  const safeQuestion = String(question || 'tu pregunta').trim() || 'tu pregunta';
  const normalizedTitle = String(threadTitle || '').trim();
  const suggestedTitle =
    normalizedTitle && normalizedTitle !== 'Nuevo chat'
      ? normalizedTitle
      : truncateText(safeQuestion, 42) || 'Tutor';

  return {
    reply: `Claro. Puedo ayudarte con ${safeQuestion}. Si quieres, te lo explico paso a paso y luego te dejo un resumen corto para repasar.`,
    suggestedTitle,
  };
}

function normalizeTutorReply(data, question, threadTitle) {
  const fallback = buildTutorFallbackReply(question, threadTitle);

  return {
    reply:
      typeof data?.reply === 'string' && data.reply.trim().length > 0
        ? data.reply.trim()
        : fallback.reply,
    suggestedTitle:
      typeof data?.suggestedTitle === 'string' && data.suggestedTitle.trim().length > 0
        ? truncateText(data.suggestedTitle.trim(), 42)
        : fallback.suggestedTitle,
  };
}

async function createTutorReply({
  threadTitle,
  question,
  messages = [],
  modelOverride = openaiModel,
}) {
  const normalizedQuestion = String(question || '').trim();
  const normalizedThreadTitle = String(threadTitle || '').trim() || 'Nuevo chat';
  const normalizedMessages = normalizeTutorMessages(messages);
  const sdk = getClient();

  if (!sdk) {
    return buildTutorFallbackReply(normalizedQuestion, normalizedThreadTitle);
  }

  try {
    const conversationText = normalizedMessages.length
      ? normalizedMessages
          .map((message, index) => {
            const label = message.role === 'assistant' ? 'Tutor' : 'Usuario';
            return `${index + 1}. ${label}: ${message.text}`;
          })
          .join('\n')
      : 'Sin contexto previo.';

    const response = await sdk.responses.create({
      model: modelOverride,
      input: [
        {
          role: 'system',
          content: [
            {
              type: 'input_text',
              text:
                'Eres Tutor, un profesor paciente y claro en espanol. Responde solo JSON valido con esta forma exacta: {"reply":"string","suggestedTitle":"string"}. Explica con ejemplos, pasos y formulas solo cuando ayuden. Si faltan datos, dilo con honestidad y pide la informacion que te falte.',
            },
          ],
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: `Titulo actual del chat: ${normalizedThreadTitle}\n\nPregunta actual:\n${normalizedQuestion || 'Sin pregunta especifica.'}\n\nConversacion previa:\n${conversationText}`,
            },
          ],
        },
      ],
    });

    return normalizeTutorReply(
      extractJsonObject(response.output_text),
      normalizedQuestion,
      normalizedThreadTitle
    );
  } catch (error) {
    console.error('Error generando respuesta del Tutor con OpenAI:', error);
    return buildTutorFallbackReply(normalizedQuestion, normalizedThreadTitle);
  }
}

function buildProblemSolution(fileName, description) {
  const normalizedName = String(fileName || 'problema');
  const normalizedDescription = String(description || '').trim();
  const subject = normalizedDescription || normalizedName;

  return {
    title: 'Solucion paso a paso',
    summary: `Voy a ayudarte a resolver ${subject}. Si faltan datos o la imagen esta borrosa, conviene revisar el enunciado completo antes de dar por cerrado el resultado.`,
    steps: [
      'Identifica que pide exactamente el enunciado.',
      'Separa los datos conocidos de lo que hay que encontrar.',
      'Aplica la formula, regla o procedimiento adecuado.',
      'Verifica si el resultado tiene sentido con el contexto.',
    ],
    finalAnswer: 'Si quieres, vuelve a subir una imagen mas clara o agrega mas detalles para afinar la solucion.',
    tips: [
      'Revisa unidades, signos y operaciones intermedias.',
      'Si es un ejercicio largo, divide el procedimiento en partes pequeñas.',
    ],
  };
}

function normalizeProblemSolution(data, fileName, description) {
  const fallback = buildProblemSolution(fileName, description);

  return {
    title:
      typeof data?.title === 'string' && data.title.trim().length > 0
        ? truncateText(data.title.trim(), 60)
        : fallback.title,
    summary:
      typeof data?.summary === 'string' && data.summary.trim().length > 0
        ? data.summary.trim()
        : fallback.summary,
    steps:
      Array.isArray(data?.steps) && data.steps.length > 0
        ? data.steps.slice(0, 8).map((step) => String(step).trim()).filter(Boolean)
        : fallback.steps,
    finalAnswer:
      typeof data?.finalAnswer === 'string' && data.finalAnswer.trim().length > 0
        ? data.finalAnswer.trim()
        : fallback.finalAnswer,
    tips:
      Array.isArray(data?.tips) && data.tips.length > 0
        ? data.tips.slice(0, 5).map((tip) => String(tip).trim()).filter(Boolean)
        : fallback.tips,
  };
}

async function solveProblemImage(buffer, mimeType, fileName, description, modelOverride = openaiModel) {
  const sdk = getClient();

  if (!sdk) {
    return buildProblemSolution(fileName, description);
  }

  try {
    const response = await sdk.responses.create({
      model: modelOverride,
      input: [
        {
          role: 'system',
          content: [
            {
              type: 'input_text',
              text:
                'Eres un profesor experto resolviendo ejercicios de matematicas, fisica y quimica. Devuelve solo JSON valido con esta forma exacta: {"title":"string","summary":"string","steps":["string"],"finalAnswer":"string","tips":["string"]}. Explica paso a paso, usando notacion clara y sin omitir pasos importantes.',
            },
          ],
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: `Archivo: ${String(fileName || 'problema')}\n\nDescripcion adicional:\n${String(
                description || 'Sin descripcion adicional.'
              )}\n\nResuelve el ejercicio de forma clara y didactica.`,
            },
            {
              type: 'input_image',
              image_url: `data:${mimeType || 'image/jpeg'};base64,${buffer.toString('base64')}`,
            },
          ],
        },
      ],
    });

    return normalizeProblemSolution(
      extractJsonObject(response.output_text),
      fileName,
      description
    );
  } catch (error) {
    console.error('Error resolviendo problema con OpenAI:', error);
    return buildProblemSolution(fileName, description);
  }
}

module.exports = {
  analyzeAudioBuffer,
  analyzeImageBuffer,
  analyzeTextFile,
  buildStudyAnalysis,
  buildExamModelAnalysis,
  buildProblemSolution,
  createTutorReply,
  solveProblemImage,
};
