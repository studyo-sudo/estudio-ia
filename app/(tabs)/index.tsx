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
import {
  createHistoryId,
  saveHistoryItem,
} from '../../services/historyStorage';
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

const BACKEND_BASE_URL =
  Platform.OS === 'web' ? 'http://localhost:3000' : 'http://192.168.1.108:3000';

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
            'Límite alcanzado',
            'En Free podés procesar hasta 3 archivos por semana. Hacete Premium para seguir sin límites molestos.'
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
        const webFile = (file as any).file;

        if (!webFile) {
          throw new Error('En web no se encontró el archivo real para subir.');
        }

        formData.append('file', webFile);
      } else {
        formData.append(
          'file',
          {
            uri: file.uri,
            name: file.name,
            type: file.mimeType || 'application/octet-stream',
          } as any
        );
      }

      const response = await fetch(`${BACKEND_BASE_URL}/analyze-file`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Backend respondió ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      if (!data?.summary) {
        throw new Error('El backend no devolvió un resumen válido.');
      }

      const generatedResult: PdfResultData = {
        summary: data.summary,
        questions:
          Array.isArray(data.questions) && data.questions.length > 0
            ? data.questions
            : [
                '¿Cuál es la idea principal del archivo?',
                '¿Qué conceptos aparecen como más importantes?',
                '¿Qué tema conviene estudiar primero?',
              ],
        flashcards:
          Array.isArray(data.flashcards) && data.flashcards.length > 0
            ? data.flashcards
            : [
                {
                  front: 'Idea principal',
                  back: 'Se genera a partir del contenido real del archivo.',
                },
              ],
        exam:
          Array.isArray(data.exam) && data.exam.length > 0
            ? data.exam
            : [
                {
                  question: '¿Cuál es la idea principal del archivo?',
                  options: [
                    'La idea principal del archivo',
                    'Un detalle menor',
                    'Una cita aislada',
                    'Una referencia externa',
                  ],
                  correctAnswer: 'La idea principal del archivo',
                },
              ],
      };

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

      const message =
        error instanceof Error ? error.message : 'Error desconocido';

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
      const webFile = (asset as any).file;

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
        } as any
      );
    }

    const response = await fetch(`${BACKEND_BASE_URL}/analyze-image`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend respondió ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    if (!data?.summary) {
      throw new Error('El backend no devolvió un análisis válido para la imagen.');
    }

    const generatedResult: PdfResultData = {
      summary: data.summary,
      questions:
        Array.isArray(data.questions) && data.questions.length > 0
          ? data.questions
          : [
              '¿Cuál es la idea principal de la imagen?',
              '¿Qué texto o concepto conviene memorizar?',
              '¿Qué fórmula o definición aparece?',
            ],
      flashcards:
        Array.isArray(data.flashcards) && data.flashcards.length > 0
          ? data.flashcards
          : [
              {
                front: 'Texto principal',
                back: 'Contenido detectado desde la imagen.',
              },
            ],
      exam:
        Array.isArray(data.exam) && data.exam.length > 0
          ? data.exam
          : [
              {
                question: '¿Qué concepto principal aparece en la imagen?',
                options: [
                  'El concepto central',
                  'Un detalle irrelevante',
                  'Una referencia externa',
                  'Nada identificable',
                ],
                correctAnswer: 'El concepto central',
              },
            ],
    };

    if (billing.plan === 'free') {
      await registerImageFreeUse();
    }

    setPdfResult(generatedResult);

    const imageName = asset.fileName || 'imagen';

    setSelectedSource({
      name: imageName,
      size:
        typeof asset.fileSize === 'number'
          ? asset.fileSize
          : (asset as any).file?.size,
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
        fileSize:
          typeof asset.fileSize === 'number'
            ? asset.fileSize
            : (asset as any).file?.size,
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
            'Límite alcanzado',
            'En Free podés procesar hasta 3 imágenes por semana. Hacete Premium para seguir.'
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

      const message =
        error instanceof Error ? error.message : 'Error desconocido';

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
            'Límite alcanzado',
            'En Free podés procesar hasta 3 imágenes por semana. Hacete Premium para seguir.'
          );
          return;
        }
      }

      await showAdIfFree();

      const permission = await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Permiso requerido',
          'Necesitas dar permiso de cámara para sacar una foto.'
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

      const message =
        error instanceof Error ? error.message : 'Error desconocido';

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

    Alert.alert('Foto de texto', 'Elegí cómo querés analizar la imagen', [
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