import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AppBottomNav from './AppBottomNav';
import { PdfResultData } from '../data/mockPdfResults';
import { APP_COLORS } from '../constants/theme';
import { buildStudyRouteFromCurrentResult } from '../services/studyRoute';

type Props = {
  fileName: string;
  fileSize?: number;
  result: PdfResultData;
  onBack: () => void;
  sourceType: 'file' | 'image' | 'audio';
};

export default function PdfResultScreen({
  fileName,
  fileSize,
  result,
  onBack,
  sourceType,
}: Props) {
  const isFile = sourceType === 'file';
  const isImage = sourceType === 'image';
  const estimatedPages = fileSize ? Math.max(1, Math.round(fileSize / 120)) : 1;
  const estimatedStudyTime = Math.max(5, estimatedPages * 3);
  const studyRoute = buildStudyRouteFromCurrentResult(
    result,
    sourceType,
    fileName,
    Date.now()
  );

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

  const handleOpenStudyRoute = () => {
    router.push('/study-route' as never);
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
          Tamano: {fileSize ? Math.round(fileSize / 1024) : 0} KB
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Estado</Text>
            <Text style={styles.statValue}>Procesado</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statLabel}>{isFile ? 'Archivo' : 'Fuente'}</Text>
            <Text style={styles.statValue}>
              {isFile ? 'Archivo' : isImage ? 'Imagen' : 'Audio'}
            </Text>
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
          Estudia las flashcards en modo interactivo, una por una, con animacion de giro.
        </Text>

        <Pressable style={styles.flashcardsButton} onPress={handleOpenFlashcards}>
        <Text style={styles.flashcardsButtonText}>Abrir flashcards</Text>
      </Pressable>
      </View>

      <View style={styles.resultCard}>
        <Text style={styles.sectionTitle}>Ruta de estudio</Text>
        <Text style={styles.flashcardsDescription}>
          {studyRoute.nextAction}
        </Text>
        {studyRoute.steps.slice(0, 3).map((step, index) => (
          <View key={`${index}-${step.title}`} style={styles.routeStep}>
            <Text style={styles.routeStepIndex}>{index + 1}</Text>
            <View style={styles.routeStepBody}>
              <Text style={styles.routeStepTitle}>{step.title}</Text>
              <Text style={styles.routeStepText}>{step.description}</Text>
            </View>
          </View>
        ))}

        <Pressable style={styles.routeButton} onPress={handleOpenStudyRoute}>
          <Text style={styles.routeButtonText}>Ver ruta completa</Text>
        </Pressable>
      </View>

      <Pressable style={styles.primaryButton} onPress={handleOpenExam}>
        <Text style={styles.primaryButtonText}>Generar examen completo</Text>
      </Pressable>

        <Pressable style={styles.secondaryButton} onPress={onBack}>
          <Text style={styles.secondaryButtonText}>Volver</Text>
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
    resultContent: {
      paddingBottom: 280,
    },
  title: {
    color: APP_COLORS.text,
    fontSize: 34,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    width: '100%',
  },
  headerCard: {
    backgroundColor: APP_COLORS.surface,
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: APP_COLORS.creamSoft,
  },
  fileName: {
    color: APP_COLORS.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  fileInfo: {
    color: APP_COLORS.textMuted,
    fontSize: 14,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: APP_COLORS.creamSoft,
  },
  statLabel: {
    color: APP_COLORS.textMuted,
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    color: APP_COLORS.text,
    fontSize: 15,
    fontWeight: '700',
  },
  resultCard: {
    backgroundColor: APP_COLORS.surface,
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: APP_COLORS.creamSoft,
  },
  sectionTitle: {
    color: APP_COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  resultText: {
    color: APP_COLORS.textMuted,
    fontSize: 15,
    lineHeight: 24,
  },
  questionBox: {
    backgroundColor: APP_COLORS.background,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: APP_COLORS.creamSoft,
  },
  questionText: {
    color: APP_COLORS.text,
    fontSize: 15,
    lineHeight: 22,
  },
  flashcardsDescription: {
    color: APP_COLORS.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 14,
  },
  flashcardsButton: {
    backgroundColor: APP_COLORS.text,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  flashcardsButtonText: {
    color: APP_COLORS.accentText,
    fontSize: 16,
    fontWeight: '700',
  },
  routeStep: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: APP_COLORS.background,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: APP_COLORS.creamSoft,
  },
  routeStepIndex: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: APP_COLORS.surface,
    color: APP_COLORS.text,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 14,
    fontWeight: '800',
    overflow: 'hidden',
  },
  routeStepBody: {
    flex: 1,
  },
  routeStepTitle: {
    color: APP_COLORS.text,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  routeStepText: {
    color: APP_COLORS.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
  routeButton: {
    backgroundColor: APP_COLORS.surface,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: APP_COLORS.creamSoft,
    marginTop: 6,
  },
  routeButtonText: {
    color: APP_COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  primaryButton: {
    backgroundColor: APP_COLORS.text,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: APP_COLORS.accentText,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: APP_COLORS.surface,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: APP_COLORS.creamSoft,
  },
  secondaryButtonText: {
    color: APP_COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
});
