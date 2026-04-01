import { describe, expect, it } from 'vitest';
import { mapStudyAnalysisToResult } from '../studyResultMapper';

describe('mapStudyAnalysisToResult', () => {
  it('uses backend values when present', () => {
    const result = mapStudyAnalysisToResult(
      {
        summary: 'backend summary',
        questions: ['q1'],
        flashcards: [{ front: 'front', back: 'back' }],
        exam: [
          {
            question: 'question',
            options: ['a', 'b', 'c', 'd'],
            correctAnswer: 'a',
          },
        ],
      },
      'file'
    );

    expect(result.summary).toBe('backend summary');
    expect(result.questions).toEqual(['q1']);
    expect(result.flashcards[0]?.front).toBe('front');
    expect(result.exam[0]?.question).toBe('question');
  });

  it('falls back when backend returns partial data', () => {
    const result = mapStudyAnalysisToResult({ summary: 'ok' }, 'audio');

    expect(result.questions.length).toBeGreaterThan(0);
    expect(result.flashcards.length).toBeGreaterThan(0);
    expect(result.exam.length).toBeGreaterThan(0);
  });

  it('throws when summary is missing', () => {
    expect(() => mapStudyAnalysisToResult({ summary: '' }, 'image')).toThrow();
  });
});
