import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AppBottomNav from '../components/AppBottomNav';
import { useAppPreferences } from '../contexts/AppPreferencesContext';

type ExamQuestion = {
  question: string;
  options: string[];
  correctAnswer: string;
};

export default function ExamScreen() {
  const { colors, t } = useAppPreferences();
  const params = useLocalSearchParams<{ exam?: string }>();
  const styles = useMemo(() => createStyles(colors), [colors]);

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
        <Text style={styles.emptyTitle}>{t('exam.noExamTitle')}</Text>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>{t('exam.noExamBack')}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('exam.title')}</Text>
        <Text style={styles.subtitle}>
          {t(exam.length === 1 ? 'exam.subtitleSingle' : 'exam.subtitleMultiple', {
            count: exam.length,
          })}
        </Text>

        {showResult && (
          <View style={styles.scoreCard}>
            <Text style={styles.scoreTitle}>{t('exam.scoreTitle')}</Text>
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
                  {t('exam.correctAnswer')} {question.correctAnswer}
                </Text>
              )}
            </View>
          );
        })}

        {!showResult ? (
          <Pressable style={styles.finishButton} onPress={handleFinish}>
            <Text style={styles.finishButtonText}>{t('exam.finish')}</Text>
          </Pressable>
        ) : null}

        <Pressable style={styles.backSecondaryButton} onPress={handleBack}>
          <Text style={styles.backSecondaryButtonText}>{t('exam.back')}</Text>
        </Pressable>
      </ScrollView>

      <AppBottomNav activeTab="home" />
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useAppPreferences>['colors']) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: 20,
      paddingTop: 24,
    },
    content: {
      paddingBottom: 160,
    },
    title: {
      color: colors.text,
      fontSize: 34,
      fontWeight: 'bold',
      marginBottom: 8,
      textAlign: 'center',
      width: '100%',
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: 15,
      marginBottom: 18,
      textAlign: 'center',
      width: '100%',
    },
    scoreCard: {
      backgroundColor: colors.cream,
      borderRadius: 18,
      padding: 20,
      marginBottom: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.creamSoft,
    },
    scoreTitle: {
      color: colors.accentText,
      fontSize: 18,
      marginBottom: 8,
      fontWeight: '600',
    },
    scoreValue: {
      color: colors.accentText,
      fontSize: 30,
      fontWeight: '800',
    },
    questionCard: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 18,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.creamSoft,
    },
    questionTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '700',
      lineHeight: 26,
      marginBottom: 14,
    },
    optionButton: {
      backgroundColor: colors.background,
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.creamSoft,
    },
    optionSelected: {
      borderWidth: 2,
      borderColor: colors.cream,
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
      color: colors.text,
      fontSize: 15,
      lineHeight: 22,
    },
    answerText: {
      color: colors.textMuted,
      fontSize: 14,
      marginTop: 8,
      lineHeight: 20,
    },
    finishButton: {
      backgroundColor: colors.cream,
      borderRadius: 14,
      paddingVertical: 15,
      alignItems: 'center',
      marginTop: 6,
      marginBottom: 12,
    },
    finishButtonText: {
      color: colors.accentText,
      fontSize: 16,
      fontWeight: '700',
    },
    backSecondaryButton: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      paddingVertical: 15,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.creamSoft,
    },
    backSecondaryButtonText: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '700',
    },
    emptyContainer: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    emptyTitle: {
      color: colors.text,
      fontSize: 24,
      fontWeight: '700',
      marginBottom: 20,
    },
    backButton: {
      backgroundColor: colors.cream,
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 28,
    },
    backButtonText: {
      color: colors.accentText,
      fontSize: 16,
      fontWeight: '700',
    },
  });
}
