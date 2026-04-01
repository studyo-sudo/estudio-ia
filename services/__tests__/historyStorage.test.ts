import { describe, expect, it } from 'vitest';
import { mergeHistoryItems, type HistoryItem } from '../historyStorage';

function createItem(id: string, createdAt: number): HistoryItem {
  return {
    id,
    type: 'pdf',
    title: `Item ${id}`,
    createdAt,
    payload: {
      kind: 'study-result',
      sourceType: 'pdf',
      fileName: `file-${id}.pdf`,
      result: {
        summary: 'summary',
        questions: ['q1'],
        flashcards: [{ front: 'f', back: 'b' }],
        exam: [
          {
            question: 'q',
            options: ['a', 'b', 'c', 'd'],
            correctAnswer: 'a',
          },
        ],
      },
    },
  };
}

describe('mergeHistoryItems', () => {
  it('keeps unique items sorted by newest first', () => {
    const merged = mergeHistoryItems(
      [createItem('local-1', 100), createItem('local-2', 300)],
      [createItem('remote-1', 200)]
    );

    expect(merged.map((item) => item.id)).toEqual(['local-2', 'remote-1', 'local-1']);
  });

  it('prefers the newest version when ids collide', () => {
    const merged = mergeHistoryItems(
      [createItem('same', 100)],
      [createItem('same', 200)]
    );

    expect(merged).toHaveLength(1);
    expect(merged[0]?.createdAt).toBe(200);
  });
});
