import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AppBottomNav from './AppBottomNav';
import { PdfResultData } from '../data/mockPdfResults';

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
    backgroundColor: '#0f172a',
  },
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingHorizontal: 20,
    paddingTop: 80,
  },
  resultContent: {
    paddingBottom: 120,
  },
  title: {
    color: 'white',
    fontSize: 34,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  headerCard: {
    backgroundColor: '#1e293b',
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
  },
  fileName: {
    color: '#93c5fd',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  fileInfo: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
  },
  resultCard: {
    backgroundColor: '#1e293b',
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  resultText: {
    color: '#cbd5e1',
    fontSize: 15,
    lineHeight: 24,
  },
  questionBox: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  questionText: {
    color: '#e2e8f0',
    fontSize: 15,
    lineHeight: 22,
  },
  flashcardsDescription: {
    color: '#cbd5e1',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 14,
  },
  flashcardsButton: {
    backgroundColor: '#7c3aed',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  flashcardsButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#cbd5e1',
    fontSize: 16,
    fontWeight: '700',
  },
});
