import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import ProcessingScreen from '../components/ProcessingScreen';
import { BillingState, getBillingState } from '../services/billingStorage';
import {
  createHistoryId,
  saveHistoryItem,
} from '../services/historyStorage';
import {
  canUseExamModelFree,
  registerExamModelFreeUse,
} from '../services/usageLimitsStorage';

type SelectedExamImage = {
  uri: string;
  name: string;
  mimeType: string;
  size?: number;
  webFile?: File;
};

type GeneratedExamQuestion = {
  question: string;
  options: string[];
  correctAnswer: string;
};

type ExamModelResult = {
  detectedTopics: string[];
  examStyle: string;
  estimatedQuestions: number;
  generatedExam: {
    questions: GeneratedExamQuestion[];
  };
};

const BACKEND_BASE_URL =
  Platform.OS === 'web' ? 'http://localhost:3000' : 'http://192.168.1.108:3000';

export default function ExamModelScreen() {
  const [images, setImages] = useState<SelectedExamImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ExamModelResult | null>(null);
  const [billing, setBilling] = useState<BillingState>({
    plan: 'free',
    credits: 0,
  });

  const loadBilling = useCallback(async () => {
    const state = await getBillingState();
    setBilling(state);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadBilling();
    }, [loadBilling])
  );

  const maxImagesAllowed = billing.plan === 'premium' ? 10 : 2;
  const canGenerate = useMemo(() => images.length >= 1, [images.length]);

  const addImagesFromLibrary = async () => {
    try {
      const resultPicker = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
        allowsMultipleSelection: true,
        selectionLimit: maxImagesAllowed,
      });

      if (resultPicker.canceled) return;

      const mappedImages: SelectedExamImage[] = resultPicker.assets.map((asset, index) => ({
        uri: asset.uri,
        name: asset.fileName || `examen-${Date.now()}-${index}.jpg`,
        mimeType: asset.mimeType || 'image/jpeg',
        size:
          typeof asset.fileSize === 'number'
            ? asset.fileSize
            : (asset as any).file?.size,
        webFile: (asset as any).file,
      }));

      setImages((prev) => {
        const merged = [...prev, ...mappedImages];
        return merged.slice(0, maxImagesAllowed);
      });
    } catch (error) {
      console.error('Error eligiendo exámenes:', error);
      Alert.alert('Error', 'No se pudieron seleccionar las imágenes.');
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleGenerate = async () => {
    try {
      if (images.length === 0) {
        Alert.alert('Faltan exámenes', 'Subí al menos una imagen de examen.');
        return;
      }

      if (billing.plan === 'free') {
        const allowed = await canUseExamModelFree();

        if (!allowed) {
          Alert.alert(
            'Límite alcanzado',
            'En Free podés generar 1 modelo de examen por semana. Premium te da una experiencia mucho más amplia.'
          );
          return;
        }
      }

      setIsProcessing(true);

      const formData = new FormData();

      for (const image of images) {
        if (Platform.OS === 'web') {
          if (!image.webFile) {
            throw new Error('En web falta el archivo real de una imagen.');
          }

          formData.append('images', image.webFile);
        } else {
          formData.append(
            'images',
            {
              uri: image.uri,
              name: image.name,
              type: image.mimeType,
            } as any
          );
        }
      }

      const response = await fetch(`${BACKEND_BASE_URL}/analyze-exam-model`, {
        method: 'POST',
        body: formData,
      });

      const rawText = await response.text();

      if (!response.ok) {
        throw new Error(`Backend respondió ${response.status}: ${rawText}`);
      }

      const data = JSON.parse(rawText);

      if (
        !data ||
        !Array.isArray(data.detectedTopics) ||
        !data.generatedExam ||
        !Array.isArray(data.generatedExam.questions)
      ) {
        throw new Error('El backend no devolvió un modelo de examen válido.');
      }

      if (billing.plan === 'free') {
        await registerExamModelFreeUse();
      }

      setResult(data);

      await saveHistoryItem({
        id: createHistoryId(),
        type: 'exam-model',
        title: `Modelo de examen (${data.generatedExam.questions.length} preguntas)`,
        createdAt: Date.now(),
        payload: {
          kind: 'exam-model',
          detectedTopics: data.detectedTopics,
          examStyle: data.examStyle,
          estimatedQuestions: data.estimatedQuestions,
          questions: data.generatedExam.questions,
        },
      });

      await loadBilling();
    } catch (error) {
      console.error('Error generando modelo de examen:', error);
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      Alert.alert('Error generando examen', message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenGeneratedExam = () => {
    if (!result) return;

    router.push({
      pathname: '/exam',
      params: {
        exam: JSON.stringify(result.generatedExam.questions),
      },
    });
  };

  const handleBack = () => {
    if (result) {
      setResult(null);
      return;
    }

    router.back();
  };

    if (isProcessing) {
    return <ProcessingScreen type="examen" />;
  }

  if (result) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Modelo de examen</Text>
        <Text style={styles.subtitle}>
          Analizamos tus exámenes y generamos uno nuevo con estilo similar.
        </Text>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Temas detectados</Text>
          {result.detectedTopics.map((topic, index) => (
            <View key={index} style={styles.topicChip}>
              <Text style={styles.topicChipText}>{topic}</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Estilo detectado</Text>
          <Text style={styles.bodyText}>{result.examStyle}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Preguntas estimadas</Text>
          <Text style={styles.bigNumber}>{result.estimatedQuestions}</Text>
          <Text style={styles.bodyText}>
            El examen generado intenta respetar la escala y el patrón de los exámenes subidos.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Examen generado</Text>
          <Text style={styles.bodyText}>
            Se generaron {result.generatedExam.questions.length} preguntas nuevas.
          </Text>
        </View>

        <Pressable style={styles.primaryButton} onPress={handleOpenGeneratedExam}>
          <Text style={styles.primaryButtonText}>Abrir examen generado</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={handleBack}>
          <Text style={styles.secondaryButtonText}>Volver</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Subir exámenes</Text>
      <Text style={styles.subtitle}>
        Subí fotos de exámenes anteriores y vamos a generar uno nuevo con estilo similar.
      </Text>

      <View style={styles.noticeCard}>
        <Text style={styles.noticeTitle}>
          {billing.plan === 'premium' ? 'Premium' : 'Plan Free'}
        </Text>
        <Text style={styles.noticeText}>
          {billing.plan === 'premium'
            ? 'Podés subir hasta 10 imágenes por modelo.'
            : 'En Free podés subir hasta 2 imágenes y generar 1 modelo por semana.'}
        </Text>
      </View>

      <Pressable style={styles.primaryButton} onPress={addImagesFromLibrary}>
        <Text style={styles.primaryButtonText}>Agregar exámenes</Text>
      </Pressable>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Exámenes cargados</Text>

        {images.length === 0 ? (
          <Text style={styles.bodyText}>Todavía no cargaste imágenes.</Text>
        ) : (
          <View style={styles.previewGrid}>
            {images.map((image, index) => (
              <View key={`${image.uri}-${index}`} style={styles.previewItem}>
                <Image source={{ uri: image.uri }} style={styles.previewImage} />
                <Text style={styles.previewLabel} numberOfLines={1}>
                  {image.name}
                </Text>
                <Pressable
                  style={styles.removeButton}
                  onPress={() => removeImage(index)}
                >
                  <Text style={styles.removeButtonText}>Quitar</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </View>

      <Pressable
        style={[styles.generateButton, !canGenerate && styles.disabledButton]}
        onPress={handleGenerate}
        disabled={!canGenerate}
      >
        <Text style={styles.generateButtonText}>Generar modelo de examen</Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={handleBack}>
        <Text style={styles.secondaryButtonText}>Volver</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 120,
  },
  title: {
    color: 'white',
    fontSize: 34,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    color: '#cbd5e1',
    fontSize: 17,
    lineHeight: 24,
    marginBottom: 18,
  },
  noticeCard: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  noticeTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  noticeText: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 22,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  bodyText: {
    color: '#cbd5e1',
    fontSize: 15,
    lineHeight: 24,
  },
  previewGrid: {
    gap: 14,
  },
  previewItem: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 12,
  },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 10,
    resizeMode: 'cover',
  },
  previewLabel: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  removeButton: {
    backgroundColor: '#7f1d1d',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  removeButtonText: {
    color: 'white',
    fontWeight: '700',
  },
  topicChip: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  topicChipText: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '600',
  },
  bigNumber: {
    color: '#93c5fd',
    fontSize: 38,
    fontWeight: '800',
    marginBottom: 10,
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  generateButton: {
    backgroundColor: '#7c3aed',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 12,
  },
  generateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.45,
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