import { postForm, postJson } from './apiClient';

export type StudyFlashcard = {
  front: string;
  back: string;
};

export type StudyExamQuestion = {
  question: string;
  options: string[];
  correctAnswer: string;
};

export type StudyAnalysisResponse = {
  summary: string;
  questions?: string[];
  flashcards?: StudyFlashcard[];
  exam?: StudyExamQuestion[];
};

export type ExamModelResponse = {
  detectedTopics: string[];
  examStyle: string;
  estimatedQuestions: number;
  generatedExam: {
    questions: StudyExamQuestion[];
  };
};

export function analyzeFile(formData: FormData) {
  return postForm<StudyAnalysisResponse>('/analyze-file', formData);
}

export function analyzeInlineFile(payload: {
  fileName: string;
  mimeType?: string;
  base64: string;
}) {
  return postJson<StudyAnalysisResponse>('/analyze-file-inline', payload);
}

export function analyzeImage(formData: FormData) {
  return postForm<StudyAnalysisResponse>('/analyze-image', formData);
}

export function analyzeAudio(formData: FormData) {
  return postForm<StudyAnalysisResponse>('/analyze-audio', formData);
}

export function analyzeExamModel(formData: FormData) {
  return postForm<ExamModelResponse>('/analyze-exam-model', formData);
}
