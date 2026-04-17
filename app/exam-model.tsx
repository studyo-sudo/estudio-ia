import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AppBottomNav from '../components/AppBottomNav';
import ProcessingScreen from '../components/ProcessingScreen';
import { useAppPreferences } from '../contexts/AppPreferencesContext';
import { createHistoryId, saveHistoryItem } from '../services/historyStorage';
import { analyzeExamModel } from '../services/studyApi';
import {
  canUseExamModelFree,
  registerExamModelFreeUse,
} from '../services/usageLimitsStorage';
import { useSyncedBilling } from '../hooks/useSyncedBilling';

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

export default function ExamModelScreen() {
  const { colors, t, locale } = useAppPreferences();
  const [images, setImages] = useState<SelectedExamImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ExamModelResult | null>(null);
  const { billing, refreshBilling } = useSyncedBilling();

  const styles = useMemo(() => createStyles(colors), [colors]);

  useFocusEffect(
    useCallback(() => {
      void refreshBilling();
    }, [refreshBilling])
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
            : (asset as { file?: File }).file?.size,
        webFile: (asset as { file?: File }).file,
      }));

      setImages((prev) => {
        const merged = [...prev, ...mappedImages];
        return merged.slice(0, maxImagesAllowed);
      });
    } catch (error) {
      console.error('Error eligiendo examenes:', error);
      Alert.alert('Error', 'No se pudieron seleccionar las imágenes.');
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleGenerate = async () => {
    try {
      if (images.length === 0) {
        Alert.alert('Faltan exámenes', 'Sube al menos una imagen de examen.');
        return;
      }

      if (billing.plan === 'free') {
        const allowed = await canUseExamModelFree();

        if (!allowed) {
          Alert.alert(
            'Límite alcanzado',
            'En Free puedes generar 1 modelo de examen por semana. Premium te da una experiencia mucho más amplia.'
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
            } as never
          );
        }
      }

      const data = await analyzeExamModel(formData);

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

      await refreshBilling();
    } catch (error) {
      console.error('Error generando modelo de examen:', error);
      const message = error instanceof Error ? error.message : 'Error desconocido';
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
      <View style={styles.screen}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>{t('examModel.titleResult')}</Text>
          <Text style={styles.subtitle}>{t('examModel.subtitleResult')}</Text>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('examModel.topics')}</Text>
            {result.detectedTopics.map((topic, index) => (
              <View key={index} style={styles.topicChip}>
                <Text style={styles.topicChipText}>{topic}</Text>
              </View>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('examModel.style')}</Text>
            <Text style={styles.bodyText}>{result.examStyle}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('examModel.estimated')}</Text>
            <Text style={styles.bigNumber}>{result.estimatedQuestions}</Text>
            <Text style={styles.bodyText}>
              El examen generado intenta respetar la escala y el patrón de los exámenes subidos.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('examModel.generated')}</Text>
            <Text style={styles.bodyText}>
              {t('examModel.savedCount', { count: result.generatedExam.questions.length })}
            </Text>
          </View>

          <Pressable style={styles.primaryButton} onPress={handleOpenGeneratedExam}>
            <Text style={styles.primaryButtonText}>{t('examModel.openGenerated')}</Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={handleBack}>
            <Text style={styles.secondaryButtonText}>{t('common.back')}</Text>
          </Pressable>
        </ScrollView>

        <AppBottomNav activeTab="home" />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{t('examModel.title')}</Text>
        <Text style={styles.subtitle}>{t('examModel.subtitle')}</Text>

        <View style={styles.noticeCard}>
          <Text style={styles.noticeTitle}>
            {billing.plan === 'premium' ? t('examModel.noticeTitlePremium') : t('examModel.noticeTitleFree')}
          </Text>
          <Text style={styles.noticeText}>
            {billing.plan === 'premium'
              ? t('examModel.noticePremium')
              : t('examModel.noticeFree')}
          </Text>
        </View>

        <Pressable style={styles.primaryButton} onPress={addImagesFromLibrary}>
          <Text style={styles.primaryButtonText}>{t('examModel.addImages')}</Text>
        </Pressable>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('examModel.loadedTitle')}</Text>

          {images.length === 0 ? (
            <Text style={styles.bodyText}>{t('examModel.noImages')}</Text>
          ) : (
            <View style={styles.previewGrid}>
              {images.map((image, index) => (
                <View key={`${image.uri}-${index}`} style={styles.previewItem}>
                  <Image source={{ uri: image.uri }} style={styles.previewImage} />
                  <Text style={styles.previewLabel} numberOfLines={1}>
                    {image.name}
                  </Text>
                  <Pressable style={styles.removeButton} onPress={() => removeImage(index)}>
                    <Text style={styles.removeButtonText}>{t('examModel.remove')}</Text>
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
          <Text style={styles.generateButtonText}>{t('examModel.generate')}</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={handleBack}>
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
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 24,
      paddingBottom: 160,
    },
    title: {
      color: colors.text,
      fontSize: 34,
      fontWeight: 'bold',
      marginBottom: 10,
      textAlign: 'center',
      width: '100%',
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: 17,
      lineHeight: 24,
      marginBottom: 18,
      textAlign: 'center',
      width: '100%',
    },
    noticeCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.creamSoft,
    },
    noticeTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 8,
    },
    noticeText: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 22,
    },
    card: {
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
      fontWeight: '700',
      marginBottom: 12,
    },
    bodyText: {
      color: colors.textMuted,
      fontSize: 15,
      lineHeight: 24,
    },
    previewGrid: {
      gap: 14,
    },
    previewItem: {
      backgroundColor: colors.background,
      borderRadius: 14,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.creamSoft,
    },
    previewImage: {
      width: '100%',
      height: 180,
      borderRadius: 12,
      marginBottom: 10,
      resizeMode: 'cover',
    },
    previewLabel: {
      color: colors.text,
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
      color: '#fee2e2',
      fontWeight: '700',
    },
    topicChip: {
      backgroundColor: colors.background,
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 12,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.creamSoft,
    },
    topicChipText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '600',
    },
    bigNumber: {
      color: colors.text,
      fontSize: 38,
      fontWeight: '800',
      marginBottom: 10,
    },
    primaryButton: {
      backgroundColor: colors.cream,
      borderRadius: 14,
      paddingVertical: 15,
      alignItems: 'center',
      marginBottom: 12,
    },
    primaryButtonText: {
      color: colors.accentText,
      fontSize: 16,
      fontWeight: '700',
    },
    generateButton: {
      backgroundColor: colors.cream,
      borderRadius: 14,
      paddingVertical: 15,
      alignItems: 'center',
      marginBottom: 12,
    },
    generateButtonText: {
      color: colors.accentText,
      fontSize: 16,
      fontWeight: '700',
    },
    disabledButton: {
      opacity: 0.45,
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
