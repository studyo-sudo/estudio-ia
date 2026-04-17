import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { EncodingType, readAsStringAsync } from 'expo-file-system/legacy';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AppBottomNav from '../components/AppBottomNav';
import PdfResultScreen from '../components/PdfResultScreen';
import ProcessingScreen from '../components/ProcessingScreen';
import { useAppPreferences } from '../contexts/AppPreferencesContext';
import { PdfResultData } from '../data/mockPdfResults';
import { createHistoryId, saveHistoryItem } from '../services/historyStorage';
import { analyzeFile, analyzeImage, analyzeInlineFile } from '../services/studyApi';
import { mapStudyAnalysisToResult } from '../services/studyResultMapper';
import {
  canUseImageFree,
  canUsePdfFree,
  registerImageFreeUse,
  registerPdfFreeUse,
} from '../services/usageLimitsStorage';

type SelectedSource = {
  name: string;
  size?: number;
  uri?: string;
  sourceType: 'file' | 'image';
};

type ProcessingType = 'archivo' | 'imagen' | 'audio' | 'examen';

export default function FileScreen() {
  const { colors, t } = useAppPreferences();
  const [selectedSource, setSelectedSource] = useState<SelectedSource | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingType, setProcessingType] = useState<ProcessingType>('archivo');
  const [result, setResult] = useState<PdfResultData | null>(null);

  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleFilePress = async () => {
    try {
      const allowed = await canUsePdfFree();

      if (!allowed) {
        Alert.alert(
          'Límite alcanzado',
          'En Free puedes procesar hasta 3 archivos por semana. Hazte Premium para seguir sin límites molestos.'
        );
        return;
      }

      const picked = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'text/plain',
          'text/markdown',
          'text/csv',
          'application/json',
          'application/xml',
          'text/xml',
          'text/html',
        ],
        copyToCacheDirectory: true,
      });

      if (picked.canceled) return;

      const file = picked.assets[0];
      setProcessingType('archivo');
      setIsProcessing(true);

      let data;

      if (Platform.OS === 'web') {
        const formData = new FormData();
        const webFile = (file as { file?: File }).file;

        if (!webFile) {
          throw new Error('En web no se encontró el archivo real para subir.');
        }

        formData.append('file', webFile);
        data = await analyzeFile(formData);
      } else {
        const base64 = await readAsStringAsync(file.uri, {
          encoding: EncodingType.Base64,
        });

        data = await analyzeInlineFile({
          fileName: file.name,
          mimeType: file.mimeType || 'application/octet-stream',
          base64,
        });
      }

      const generatedResult: PdfResultData = mapStudyAnalysisToResult(data, 'file');

      await registerPdfFreeUse();

      setResult(generatedResult);
      setSelectedSource({
        name: file.name,
        size: file.size,
        uri: file.uri,
        sourceType: 'file',
      });

      await saveHistoryItem({
        id: createHistoryId(),
        type: 'file',
        title: file.name,
        createdAt: Date.now(),
        payload: {
          kind: 'study-result',
          sourceType: 'file',
          fileName: file.name,
          fileSize: file.size,
          result: generatedResult,
        },
      });
    } catch (error) {
      console.error('Error al procesar archivo:', error);
      const message = error instanceof Error ? error.message : 'Error desconocido';
      Alert.alert('Error procesando archivo', message);
    } finally {
      setIsProcessing(false);
    }
  };

  const processImageAsset = async (asset: ImagePicker.ImagePickerAsset) => {
    setProcessingType('imagen');
    setIsProcessing(true);

    const formData = new FormData();

    if (Platform.OS === 'web') {
      const webFile = (asset as { file?: File }).file;

      if (!webFile) {
        throw new Error('En web no se encontró el archivo real de la imagen.');
      }

      formData.append('image', webFile);
    } else {
      formData.append(
        'image',
        {
          uri: asset.uri,
          name: asset.fileName || 'imagen.jpg',
          type: asset.mimeType || 'image/jpeg',
        } as never
      );
    }

    const data = await analyzeImage(formData);
    const generatedResult: PdfResultData = mapStudyAnalysisToResult(data, 'image');

    await registerImageFreeUse();

    const imageName = asset.fileName || 'imagen';
    const imageSize =
      typeof asset.fileSize === 'number'
        ? asset.fileSize
        : (asset as { file?: File }).file?.size;

    setResult(generatedResult);
    setSelectedSource({
      name: imageName,
      size: imageSize,
      uri: asset.uri,
      sourceType: 'image',
    });

    await saveHistoryItem({
      id: createHistoryId(),
      type: 'image',
      title: imageName,
      createdAt: Date.now(),
      payload: {
        kind: 'study-result',
        sourceType: 'image',
        fileName: imageName,
        fileSize: imageSize,
        result: generatedResult,
      },
    });
  };

  const openImageLibrary = async () => {
    try {
      const allowed = await canUseImageFree();

      if (!allowed) {
        Alert.alert(
          'Límite alcanzado',
          'En Free puedes procesar hasta 3 imágenes por semana. Hazte Premium para seguir.'
        );
        return;
      }

      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
      });

      if (picked.canceled) return;
      await processImageAsset(picked.assets[0]);
    } catch (error) {
      console.error('Error al procesar imagen:', error);
      const message = error instanceof Error ? error.message : 'Error desconocido';
      Alert.alert('Error procesando imagen', message);
    } finally {
      setIsProcessing(false);
    }
  };

  const openCamera = async () => {
    try {
      const allowed = await canUseImageFree();

      if (!allowed) {
        Alert.alert(
          'Límite alcanzado',
          'En Free puedes procesar hasta 3 imágenes por semana. Hazte Premium para seguir.'
        );
        return;
      }

      const permission = await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        Alert.alert('Permiso requerido', 'Necesitas dar permiso de cámara para sacar una foto.');
        return;
      }

      const picked = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
      });

      if (picked.canceled) return;
      await processImageAsset(picked.assets[0]);
    } catch (error) {
      console.error('Error al sacar foto:', error);
      const message = error instanceof Error ? error.message : 'Error desconocido';
      Alert.alert('Error sacando foto', message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImagePress = async () => {
    if (Platform.OS === 'web') {
      await openImageLibrary();
      return;
    }

    Alert.alert('Imagen', 'Elige cómo quieres analizar la imagen', [
      {
        text: 'Cámara',
        onPress: () => {
          void openCamera();
        },
      },
      {
        text: 'Galería',
        onPress: () => {
          void openImageLibrary();
        },
      },
      {
        text: t('common.cancel'),
        style: 'cancel',
      },
    ]);
  };

  const handleAudioPress = async () => {
    router.push('/audio');
  };

  const handleReset = () => {
    setSelectedSource(null);
    setResult(null);
    setIsProcessing(false);
    setProcessingType('archivo');
  };

  if (isProcessing) {
    return <ProcessingScreen type={processingType} />;
  }

  if (selectedSource && result) {
    return (
      <PdfResultScreen
        fileName={selectedSource.name}
        fileSize={selectedSource.size}
        result={result}
        onBack={handleReset}
        sourceType={selectedSource.sourceType}
      />
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{t('file.title')}</Text>
        <Text style={styles.subtitle}>{t('file.subtitle')}</Text>

        <View style={styles.cardContainer}>
          <Pressable style={styles.card} onPress={handleFilePress}>
            <Text style={styles.cardEmoji}>{t('file.source.file')}</Text>
            <Text style={styles.cardTitle}>{t('file.fileTitle')}</Text>
            <Text style={styles.cardText}>{t('file.fileText')}</Text>
          </Pressable>

          <Pressable style={styles.card} onPress={handleImagePress}>
            <Text style={styles.cardEmoji}>{t('file.source.image')}</Text>
            <Text style={styles.cardTitle}>{t('file.imageTitle')}</Text>
            <Text style={styles.cardText}>{t('file.imageText')}</Text>
          </Pressable>

          <Pressable style={styles.card} onPress={handleAudioPress}>
            <Text style={styles.cardEmoji}>{t('file.source.audio')}</Text>
            <Text style={styles.cardTitle}>{t('file.audioTitle')}</Text>
            <Text style={styles.cardText}>{t('file.audioText')}</Text>
          </Pressable>
        </View>
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
      marginBottom: 24,
      textAlign: 'center',
      width: '100%',
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
