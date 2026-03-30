import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type ExamQuestion = {
  question: string;
  options: string[];
  correctAnswer: string;
};

export default function ExamScreen() {
  const params = useLocalSearchParams<{ exam?: string }>();

  const exam: ExamQuestion[] = useMemo(() => {
    try {
      if (!params.exam || typeof params.exam !== 'string') return [];
      const parsed = JSON.parse(params.exam);

      if (!Array.isArray(parsed)) return [];

      return parsed.filter(
        (item) =>
          item &&
          typeof item.question === 'string' &&
          Array.isArray(item.options) &&
          item.options.length === 4 &&
          item.options.every((opt: unknown) => typeof opt === 'string') &&
          typeof item.correctAnswer === 'string'
      );
    } catch {
      return [];
    }
  }, [params.exam]);

  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showResult, setShowResult] = useState(false);

  const handleSelect = (questionIndex: number, option: string) => {
    if (showResult) return;

    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIndex]: option,
    }));
  };

  const handleFinish = () => {
    setShowResult(true);
  };

  const handleBack = () => {
    router.back();
  };

  const score = exam.reduce((total, question, index) => {
    return selectedAnswers[index] === question.correctAnswer ? total + 1 : total;
  }, 0);

  if (exam.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No hay examen disponible</Text>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Examen completo</Text>

      {showResult && (
        <View style={styles.scoreCard}>
          <Text style={styles.scoreTitle}>Tu puntaje</Text>
          <Text style={styles.scoreValue}>
            {score} / {exam.length}
          </Text>
        </View>
      )}

      {exam.map((question, questionIndex) => {
        const selected = selectedAnswers[questionIndex];

        return (
          <View key={questionIndex} style={styles.questionCard}>
            <Text style={styles.questionTitle}>
              {questionIndex + 1}. {question.question}
            </Text>

            {question.options.map((option, optionIndex) => {
              const isSelected = selected === option;
              const isCorrect = question.correctAnswer === option;
              const isWrongSelected = showResult && isSelected && !isCorrect;

              return (
                <Pressable
                  key={optionIndex}
                  style={[
                    styles.optionButton,
                    isSelected && styles.optionSelected,
                    showResult && isCorrect && styles.optionCorrect,
                    isWrongSelected && styles.optionWrong,
                  ]}
                  onPress={() => handleSelect(questionIndex, option)}
                >
                  <Text style={styles.optionText}>{option}</Text>
                </Pressable>
              );
            })}

            {showResult && (
              <Text style={styles.answerText}>
                Respuesta correcta: {question.correctAnswer}
              </Text>
            )}
          </View>
        );
      })}

      {!showResult ? (
        <Pressable style={styles.finishButton} onPress={handleFinish}>
          <Text style={styles.finishButtonText}>Terminar examen</Text>
        </Pressable>
      ) : null}

      <Pressable style={styles.backSecondaryButton} onPress={handleBack}>
        <Text style={styles.backSecondaryButtonText}>Volver</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingHorizontal: 20,
    paddingTop: 80,
  },
  content: {
    paddingBottom: 40,
  },
  title: {
    color: 'white',
    fontSize: 34,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  scoreCard: {
    backgroundColor: '#1d4ed8',
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  scoreTitle: {
    color: 'white',
    fontSize: 18,
    marginBottom: 8,
    fontWeight: '600',
  },
  scoreValue: {
    color: 'white',
    fontSize: 30,
    fontWeight: '800',
  },
  questionCard: {
    backgroundColor: '#1e293b',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
  },
  questionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 26,
    marginBottom: 14,
  },
  optionButton: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  optionSelected: {
    borderWidth: 2,
    borderColor: '#60a5fa',
  },
  optionCorrect: {
    backgroundColor: '#166534',
    borderWidth: 2,
    borderColor: '#4ade80',
  },
  optionWrong: {
    backgroundColor: '#991b1b',
    borderWidth: 2,
    borderColor: '#f87171',
  },
  optionText: {
    color: 'white',
    fontSize: 15,
    lineHeight: 22,
  },
  answerText: {
    color: '#cbd5e1',
    fontSize: 14,
    marginTop: 8,
    lineHeight: 20,
  },
  finishButton: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 12,
  },
  finishButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  backSecondaryButton: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  backSecondaryButtonText: {
    color: '#cbd5e1',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});