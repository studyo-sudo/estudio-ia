import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Platform } from 'react-native';
import HomeScreenContent from '../../components/HomeScreenContent';
import PdfResultScreen from '../../components/PdfResultScreen';
import ProcessingScreen from '../../components/ProcessingScreen';
import { PdfResultData } from '../../data/mockPdfResults';
import { showAdIfFree } from '../../services/adsService';
import { BillingState, getBillingState } from '../../services/billingStorage';
import { createHistoryId, saveHistoryItem } from '../../services/historyStorage';
import { analyzeFile, analyzeImage } from '../../services/studyApi';
import { mapStudyAnalysisToResult } from '../../services/studyResultMapper';
import {
  canUseImageFree,
  canUsePdfFree,
  registerImageFreeUse,
  registerPdfFreeUse,
} from '../../services/usageLimitsStorage';

type SelectedSource = {
  name: string;
  size?: number;
  uri?: string;
  sourceType: 'pdf' | 'image';
};

type ProcessingType = 'archivo' | 'imagen' | 'audio' | 'examen';

export default function HomeScreen() {
  const [selectedSource, setSelectedSource] = useState<SelectedSource | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingType, setProcessingType] = useState<ProcessingType>('archivo');
  const [pdfResult, setPdfResult] = useState<PdfResultData | null>(null);
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

  const handlePdfPress = async () => {
    try {
      if (billing.plan === 'free') {
        const allowed = await canUsePdfFree();

        if (!allowed) {
          Alert.alert(
            'Limite alcanzado',
            'En Free puedes procesar hasta 3 archivos por semana. Hazte Premium para seguir sin limites molestos.'
          );
          return;
        }
      }

      await showAdIfFree();

      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/plain'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      setProcessingType('archivo');
      setIsProcessing(true);

      const formData = new FormData();

      if (Platform.OS === 'web') {
        const webFile = (file as { file?: File }).file;

        if (!webFile) {
          throw new Error('En web no se encontro el archivo real para subir.');
        }

        formData.append('file', webFile);
      } else {
        formData.append(
          'file',
          {
            uri: file.uri,
            name: file.name,
            type: file.mimeType || 'application/octet-stream',
          } as never
        );
      }

      const data = await analyzeFile(formData);
      const generatedResult: PdfResultData = mapStudyAnalysisToResult(data, 'file');

      if (billing.plan === 'free') {
        await registerPdfFreeUse();
      }

      setPdfResult(generatedResult);
      setSelectedSource({
        name: file.name,
        size: file.size,
        uri: file.uri,
        sourceType: 'pdf',
      });

      await saveHistoryItem({
        id: createHistoryId(),
        type: 'pdf',
        title: file.name,
        createdAt: Date.now(),
        payload: {
          kind: 'study-result',
          sourceType: 'pdf',
          fileName: file.name,
          fileSize: file.size,
          result: generatedResult,
        },
      });

      await loadBilling();
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
        throw new Error('En web no se encontro el archivo real de la imagen.');
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

    if (billing.plan === 'free') {
      await registerImageFreeUse();
    }

    setPdfResult(generatedResult);

    const imageName = asset.fileName || 'imagen';
    const imageSize =
      typeof asset.fileSize === 'number'
        ? asset.fileSize
        : (asset as { file?: File }).file?.size;

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

    await loadBilling();
  };

  const openImageLibrary = async () => {
    try {
      if (billing.plan === 'free') {
        const allowed = await canUseImageFree();

        if (!allowed) {
          Alert.alert(
            'Limite alcanzado',
            'En Free puedes procesar hasta 3 imagenes por semana. Hazte Premium para seguir.'
          );
          return;
        }
      }

      await showAdIfFree();

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
      });

      if (result.canceled) return;
      await processImageAsset(result.assets[0]);
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
      if (billing.plan === 'free') {
        const allowed = await canUseImageFree();

        if (!allowed) {
          Alert.alert(
            'Limite alcanzado',
            'En Free puedes procesar hasta 3 imagenes por semana. Hazte Premium para seguir.'
          );
          return;
        }
      }

      await showAdIfFree();

      const permission = await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Permiso requerido',
          'Necesitas dar permiso de camara para sacar una foto.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
      });

      if (result.canceled) return;
      await processImageAsset(result.assets[0]);
    } catch (error) {
      console.error('Error al sacar foto:', error);
      const message = error instanceof Error ? error.message : 'Error desconocido';
      Alert.alert('Error sacando foto', message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePhotoPress = async () => {
    if (Platform.OS === 'web') {
      await openImageLibrary();
      return;
    }

    Alert.alert('Foto de texto', 'Elige como quieres analizar la imagen', [
      {
        text: 'Camara',
        onPress: () => {
          void openCamera();
        },
      },
      {
        text: 'Galeria',
        onPress: () => {
          void openImageLibrary();
        },
      },
      {
        text: 'Cancelar',
        style: 'cancel',
      },
    ]);
  };

  const handleAudioPress = async () => {
    await showAdIfFree();
    router.push('/audio');
  };

  const handleExamModelPress = async () => {
    await showAdIfFree();
    router.push('/exam-model');
  };

  const handleFlashcardsHistoryPress = () => {
    router.push('/flashcards-history');
  };

  const handleReset = () => {
    setSelectedSource(null);
    setPdfResult(null);
    setIsProcessing(false);
    setProcessingType('archivo');
  };

  if (isProcessing) {
    return <ProcessingScreen type={processingType} />;
  }

  if (selectedSource && pdfResult) {
    return (
      <PdfResultScreen
        fileName={selectedSource.name}
        fileSize={selectedSource.size}
        result={pdfResult}
        onBack={handleReset}
        sourceType={selectedSource.sourceType}
      />
    );
  }

  return (
    <HomeScreenContent
      onPdfPress={handlePdfPress}
      onAudioPress={handleAudioPress}
      onPhotoPress={handlePhotoPress}
      onExamModelPress={handleExamModelPress}
      onFlashcardsHistoryPress={handleFlashcardsHistoryPress}
      plan={billing.plan}
      credits={billing.credits}
    />
  );
}
