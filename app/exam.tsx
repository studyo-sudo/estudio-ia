import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AppBottomNav from '../components/AppBottomNav';
import { APP_COLORS } from '../constants/theme';

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
    <View style={styles.screen}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Examen completo</Text>
      <Text style={styles.subtitle}>
        {exam.length} {exam.length === 1 ? 'pregunta disponible' : 'preguntas disponibles'}
      </Text>

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

      <AppBottomNav activeTab="home" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
    content: {
      paddingBottom: 280,
    },
  title: {
    color: APP_COLORS.text,
    fontSize: 34,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    width: '100%',
  },
  subtitle: {
    color: APP_COLORS.textMuted,
    fontSize: 15,
    marginBottom: 18,
    textAlign: 'center',
    width: '100%',
  },
  scoreCard: {
    backgroundColor: APP_COLORS.text,
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: APP_COLORS.creamSoft,
  },
  scoreTitle: {
    color: APP_COLORS.accentText,
    fontSize: 18,
    marginBottom: 8,
    fontWeight: '600',
  },
  scoreValue: {
    color: APP_COLORS.accentText,
    fontSize: 30,
    fontWeight: '800',
  },
  questionCard: {
    backgroundColor: APP_COLORS.surface,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: APP_COLORS.creamSoft,
  },
  questionTitle: {
    color: APP_COLORS.text,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 26,
    marginBottom: 14,
  },
  optionButton: {
    backgroundColor: APP_COLORS.background,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: APP_COLORS.creamSoft,
  },
  optionSelected: {
    borderWidth: 2,
    borderColor: APP_COLORS.text,
  },
  optionCorrect: {
    backgroundColor: '#d9f3e2',
    borderWidth: 2,
    borderColor: '#a7d8b6',
  },
  optionWrong: {
    backgroundColor: '#f7d8d8',
    borderWidth: 2,
    borderColor: '#e4a8a8',
  },
  optionText: {
    color: APP_COLORS.text,
    fontSize: 15,
    lineHeight: 22,
  },
  answerText: {
    color: APP_COLORS.textMuted,
    fontSize: 14,
    marginTop: 8,
    lineHeight: 20,
  },
  finishButton: {
    backgroundColor: APP_COLORS.text,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 12,
  },
  finishButtonText: {
    color: APP_COLORS.accentText,
    fontSize: 16,
    fontWeight: '700',
  },
  backSecondaryButton: {
    backgroundColor: APP_COLORS.surface,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: APP_COLORS.creamSoft,
  },
  backSecondaryButtonText: {
    color: APP_COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: {
    color: APP_COLORS.text,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: APP_COLORS.text,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  backButtonText: {
    color: APP_COLORS.accentText,
    fontSize: 16,
    fontWeight: '700',
  },
});
