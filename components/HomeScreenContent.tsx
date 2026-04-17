import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAppPreferences } from '../contexts/AppPreferencesContext';

type Props = {
  onFilePress: () => void;
  onExamModelPress: () => void;
  onFlashcardsHistoryPress: () => void;
  onProblemSolverPress: () => void;
  onTutorPress: () => void;
};

export default function HomeScreenContent({
  onFilePress,
  onExamModelPress,
  onFlashcardsHistoryPress,
  onProblemSolverPress,
  onTutorPress,
}: Props) {
  const { colors, t } = useAppPreferences();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>{t('home.appName')}</Text>
      <Text style={styles.subtitle}>{t('home.subtitle')}</Text>

      <View style={styles.cardContainer}>
        <Pressable style={styles.card} onPress={onFilePress}>
          <Text style={styles.cardEmoji}>{t('home.file.badge')}</Text>
          <Text style={styles.cardTitle}>{t('home.file.title')}</Text>
          <Text style={styles.cardText}>{t('home.file.text')}</Text>
        </Pressable>

        <Pressable style={styles.card} onPress={onExamModelPress}>
          <Text style={styles.cardEmoji}>{t('home.exam.badge')}</Text>
          <Text style={styles.cardTitle}>{t('home.exam.title')}</Text>
          <Text style={styles.cardText}>{t('home.exam.text')}</Text>
        </Pressable>

        <Pressable style={styles.card} onPress={onProblemSolverPress}>
          <Text style={styles.cardEmoji}>{t('home.solve.badge')}</Text>
          <Text style={styles.cardTitle}>{t('home.solve.title')}</Text>
          <Text style={styles.cardText}>{t('home.solve.text')}</Text>
        </Pressable>

        <Pressable style={styles.card} onPress={onTutorPress}>
          <Text style={styles.cardEmoji}>{t('home.tutor.badge')}</Text>
          <Text style={styles.cardTitle}>{t('home.tutor.title')}</Text>
          <Text style={styles.cardText}>{t('home.tutor.text')}</Text>
        </Pressable>

        <Pressable style={styles.card} onPress={onFlashcardsHistoryPress}>
          <Text style={styles.cardEmoji}>{t('home.cards.badge')}</Text>
          <Text style={styles.cardTitle}>{t('home.cards.title')}</Text>
          <Text style={styles.cardText}>{t('home.cards.text')}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function createStyles(colors: ReturnType<typeof useAppPreferences>['colors']) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 80,
      paddingBottom: 160,
    },
    title: {
      color: colors.text,
      fontSize: 34,
      fontWeight: 'bold',
      marginBottom: 10,
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: 17,
      lineHeight: 24,
      marginBottom: 24,
    },
    cardContainer: {
      gap: 16,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.creamSoft,
    },
    cardEmoji: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '800',
      marginBottom: 10,
    },
    cardTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 8,
    },
    cardText: {
      color: colors.textMuted,
      fontSize: 15,
      lineHeight: 22,
    },
  });
}
