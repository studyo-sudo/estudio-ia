import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAppPreferences } from '../contexts/AppPreferencesContext';
import { PdfResultData } from '../data/mockPdfResults';
import AppBottomNav from './AppBottomNav';

type Props = {
  fileName: string;
  fileSize?: number;
  result: PdfResultData;
  onBack: () => void;
  sourceType: 'file' | 'image' | 'audio';
  processingState?: 'success' | 'error';
};

function estimateStudyMinutes(fileSize?: number, result?: PdfResultData) {
  const fileSizeMb = fileSize ? fileSize / (1024 * 1024) : 0;
  const contentWeight =
    (result?.questions.length ?? 0) * 3 +
    (result?.flashcards.length ?? 0) * 2 +
    (result?.exam.length ?? 0) * 2;

  const minutes = 12 + fileSizeMb * 12 + contentWeight;
  return Math.max(15, Math.min(180, Math.round(minutes)));
}

export default function PdfResultScreen({
  fileName,
  fileSize,
  result,
  onBack,
  sourceType,
  processingState = 'success',
}: Props) {
  const { colors, t } = useAppPreferences();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isFile = sourceType === 'file';
  const isImage = sourceType === 'image';
  const sourceInfo = isFile
    ? { emoji: '📁', label: t('file.source.file') }
    : isImage
    ? { emoji: '📷', label: t('file.source.image') }
    : { emoji: '🎤', label: t('file.source.audio') };
  const estimatedStudyTime = estimateStudyMinutes(fileSize, result);
  const statusIcon = processingState === 'error' ? 'close-circle' : 'checkmark-circle';
  const statusColor = processingState === 'error' ? '#ef4444' : '#22c55e';

  const handleOpenFlashcards = () => {
    router.push({
      pathname: '/flashcards',
      params: {
        cards: JSON.stringify(result.flashcards),
      },
    });
  };

  const handleOpenExam = () => {
    router.push({
      pathname: '/exam',
      params: {
        exam: JSON.stringify(result.exam),
      },
    });
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.resultContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>
          {isFile
            ? 'Resultado del archivo'
            : isImage
            ? 'Resultado de la imagen'
            : 'Resultado del audio'}
        </Text>

        <View style={styles.headerCard}>
          <Text style={styles.fileName}>{fileName}</Text>
          <Text style={styles.fileInfo}>
            Tamaño: {fileSize ? Math.round(fileSize / 1024) : 0} KB
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Estado</Text>
              <Ionicons name={statusIcon} size={30} color={statusColor} />
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Fuente</Text>
              <Text style={styles.sourceEmoji}>{sourceInfo.emoji}</Text>
              <Text style={styles.sourceText}>{sourceInfo.label}</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Estudio</Text>
              <Text style={styles.statValue}>
                {isFile ? `${estimatedStudyTime} min` : isImage ? 'Visual' : 'Clase'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.resultCard}>
          <Text style={styles.sectionTitle}>Resumen</Text>
          <Text style={styles.resultText}>{result.summary}</Text>
        </View>

        <View style={styles.resultCard}>
          <Text style={styles.sectionTitle}>Preguntas tipo examen</Text>
          {result.questions.map((question, index) => (
            <View key={index} style={styles.questionBox}>
              <Text style={styles.questionText}>
                {index + 1}. {question}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.resultCard}>
          <Text style={styles.sectionTitle}>Flashcards</Text>
          <Text style={styles.flashcardsDescription}>
            Estudia las flashcards en modo interactivo, una por una, con animación de giro.
          </Text>

          <Pressable style={styles.flashcardsButton} onPress={handleOpenFlashcards}>
            <Text style={styles.flashcardsButtonText}>{t('flashcards.title')}</Text>
          </Pressable>
        </View>

        <Pressable style={styles.primaryButton} onPress={handleOpenExam}>
          <Text style={styles.primaryButtonText}>Generar examen completo</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={onBack}>
          <Text style={styles.secondaryButtonText}>{t('common.back')}</Text>
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
    resultContent: {
      paddingBottom: 140,
    },
    title: {
      color: colors.text,
      fontSize: 34,
      fontWeight: 'bold',
      marginBottom: 16,
      textAlign: 'center',
      width: '100%',
    },
    headerCard: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.creamSoft,
    },
    fileName: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 6,
    },
    fileInfo: {
      color: colors.textMuted,
      fontSize: 14,
      marginBottom: 16,
    },
    statsRow: {
      flexDirection: 'row',
      gap: 10,
    },
    statBox: {
      flex: 1,
      backgroundColor: colors.background,
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 10,
      borderWidth: 1,
      borderColor: colors.creamSoft,
      minHeight: 96,
      alignItems: 'center',
      justifyContent: 'center',
    },
    statLabel: {
      color: colors.textMuted,
      fontSize: 12,
      marginBottom: 8,
      textAlign: 'center',
    },
    statValue: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '700',
      textAlign: 'center',
    },
    sourceEmoji: {
      fontSize: 28,
      marginBottom: 4,
    },
    sourceText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '700',
      textAlign: 'center',
    },
    resultCard: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.creamSoft,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 12,
    },
    resultText: {
      color: colors.textMuted,
      fontSize: 15,
      lineHeight: 24,
    },
    questionBox: {
      backgroundColor: colors.background,
      borderRadius: 14,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.creamSoft,
    },
    questionText: {
      color: colors.text,
      fontSize: 15,
      lineHeight: 22,
    },
    flashcardsDescription: {
      color: colors.textMuted,
      fontSize: 15,
      lineHeight: 22,
      marginBottom: 14,
    },
    flashcardsButton: {
      backgroundColor: colors.cream,
      borderRadius: 14,
      paddingVertical: 15,
      alignItems: 'center',
    },
    flashcardsButtonText: {
      color: colors.accentText,
      fontSize: 16,
      fontWeight: '700',
    },
    primaryButton: {
      backgroundColor: colors.cream,
      borderRadius: 14,
      paddingVertical: 15,
      alignItems: 'center',
      marginTop: 4,
      marginBottom: 12,
    },
    primaryButtonText: {
      color: colors.accentText,
      fontSize: 16,
      fontWeight: '700',
    },
    secondaryButton: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      paddingVertical: 15,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.creamSoft,
    },
    secondaryButtonText: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '700',
    },
  });
}
