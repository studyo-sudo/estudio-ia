import { ApiError, postForm } from './apiClient';

export type ProblemSolutionResponse = {
  title: string;
  summary: string;
  steps: string[];
  finalAnswer: string;
  tips?: string[];
};

function buildFallbackProblemSolution(description: string, fileName?: string): ProblemSolutionResponse {
  const normalizedDescription = description.trim();
  const subject = normalizedDescription || fileName || 'problema';

  return {
    title: 'Solucion paso a paso',
    summary: `Voy a ayudarte a resolver ${subject}. Si faltan datos o la imagen esta borrosa, conviene revisar el enunciado completo antes de dar por cerrado el resultado.`,
    steps: [
      'Identifica que pide exactamente el enunciado.',
      'Separa los datos conocidos de lo que hay que encontrar.',
      'Aplica la formula, regla o procedimiento adecuado.',
      'Verifica si el resultado tiene sentido con el contexto.',
    ],
    finalAnswer:
      'Si quieres, vuelve a subir una imagen mas clara o agrega mas detalles para afinar la solucion.',
    tips: [
      'Revisa unidades, signos y operaciones intermedias.',
      'Si es un ejercicio largo, divide el procedimiento en partes pequenas.',
    ],
  };
}

export async function analyzeProblem(
  formData: FormData,
  fallback?: { description?: string; fileName?: string }
): Promise<ProblemSolutionResponse> {
  try {
    return await postForm<ProblemSolutionResponse>('/analyze-problem', formData);
  } catch (error) {
    if (error instanceof ApiError && error.status < 500 && error.status !== 404) {
      throw error;
    }

    return buildFallbackProblemSolution(fallback?.description || '', fallback?.fileName);
  }
}
