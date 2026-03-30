import {
  getRecordingPermissionsAsync,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import PdfResultScreen from '../components/PdfResultScreen';
import ProcessingScreen from '../components/ProcessingScreen';
import { PdfResultData } from '../data/mockPdfResults';
import { showAdIfFree } from '../services/adsService';
import {
  BillingState,
  consumeCredits,
  getBillingState,
} from '../services/billingStorage';
import {
  createHistoryId,
  saveHistoryItem,
} from '../services/historyStorage';

const BACKEND_BASE_URL =
  Platform.OS === 'web' ? 'http://localhost:3000' : 'http://192.168.1.108:3000';

function formatDuration(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function getAudioCreditCost(durationMillis: number) {
  const minutes = Math.max(1, Math.ceil(durationMillis / 60000));
  return minutes * 2;
}

export default function AudioScreen() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);

  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<PdfResultData | null>(null);
  const [recordingName, setRecordingName] = useState('clase-grabada');
  const [recordingSize, setRecordingSize] = useState<number | undefined>(undefined);
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

  const ensurePermission = async () => {
    const current = await getRecordingPermissionsAsync();

    if (current.granted) return true;

    const requested = await requestRecordingPermissionsAsync();
    return requested.granted;
  };

  const handleStartRecording = async () => {
    try {
      if (billing.plan === 'free' && billing.credits <= 0) {
        Alert.alert(
          'Créditos requeridos',
          'En Free el audio solo se usa con créditos. Comprá créditos para analizar grabaciones.'
        );
        return;
      }

      await showAdIfFree();

      const granted = await ensurePermission();

      if (!granted) {
        Alert.alert(
          'Permiso requerido',
          'Necesitás dar permiso de micrófono para grabar audio.'
        );
        return;
      }

      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });

      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch (error) {
      console.error('Error iniciando grabación:', error);
      Alert.alert('Error', 'No se pudo iniciar la grabación.');
    }
  };

  const handleStopAndAnalyze = async () => {
    try {
      await recorder.stop();

      const audioUri = recorder.uri || recorderState.url;

      if (!audioUri) {
        throw new Error('No se encontró el archivo de audio grabado.');
      }

      const durationMillis = recorderState.durationMillis || 0;
      const neededCredits = getAudioCreditCost(durationMillis);

      if (billing.plan === 'free') {
        const consumed = await consumeCredits(neededCredits);

        if (!consumed) {
          await loadBilling();
          Alert.alert(
            'Créditos insuficientes',
            `Esta grabación necesita ${neededCredits} créditos. Comprá más créditos o acortá la duración.`
          );
          return;
        }
      }

      setIsProcessing(true);

      const formData = new FormData();

      let finalName = 'clase-grabada.m4a';
      let finalSize: number | undefined = undefined;

      if (Platform.OS === 'web') {
        const response = await fetch(audioUri);
        const blob = await response.blob();

        const safeType =
          blob.type && blob.type.startsWith('audio/') ? blob.type : 'audio/webm';

        const fileName = safeType.includes('mp4') || safeType.includes('m4a')
          ? 'clase-grabada.m4a'
          : safeType.includes('mpeg')
          ? 'clase-grabada.mp3'
          : safeType.includes('wav')
          ? 'clase-grabada.wav'
          : 'clase-grabada.webm';

        const file = new File([blob], fileName, {
          type: safeType,
        });

        formData.append('audio', file);
        finalName = fileName;
        finalSize = blob.size;
      } else {
        formData.append(
          'audio',
          {
            uri: audioUri,
            name: 'clase-grabada.m4a',
            type: 'audio/m4a',
          } as any
        );
      }

      const backendResponse = await fetch(`${BACKEND_BASE_URL}/analyze-audio`, {
        method: 'POST',
        body: formData,
      });

      const rawText = await backendResponse.text();

      if (!backendResponse.ok) {
        throw new Error(`Backend respondió ${backendResponse.status}: ${rawText}`);
      }

      const data = JSON.parse(rawText);

      if (!data?.summary) {
        throw new Error('El backend no devolvió un resumen válido del audio.');
      }

      const generatedResult: PdfResultData = {
        summary: data.summary,
        questions:
          Array.isArray(data.questions) && data.questions.length > 0
            ? data.questions
            : [
                '¿Cuál fue la idea principal de la clase?',
                '¿Qué conceptos fueron los más importantes?',
                '¿Qué conviene repasar primero?',
              ],
        flashcards:
          Array.isArray(data.flashcards) && data.flashcards.length > 0
            ? data.flashcards
            : [
                {
                  front: 'Tema principal',
                  back: 'Generado desde la transcripción del audio.',
                },
              ],
        exam:
          Array.isArray(data.exam) && data.exam.length > 0
            ? data.exam
            : [
                {
                  question: '¿Cuál fue el tema principal de la clase?',
                  options: [
                    'El tema central',
                    'Un detalle irrelevante',
                    'Una opinión aislada',
                    'Nada importante',
                  ],
                  correctAnswer: 'El tema central',
                },
              ],
      };

      setRecordingName(finalName);
      setRecordingSize(finalSize);
      setResult(generatedResult);

      await saveHistoryItem({
        id: createHistoryId(),
        type: 'audio',
        title: finalName,
        createdAt: Date.now(),
        payload: {
          kind: 'study-result',
          sourceType: 'audio',
          fileName: finalName,
          fileSize: finalSize,
          result: generatedResult,
        },
      });

      await loadBilling();
    } catch (error) {
      console.error('Error procesando audio:', error);
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      Alert.alert('Error procesando audio', message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBack = () => {
    if (result) {
      setResult(null);
      return;
    }

    router.back();
  };

  const freeAudioText =
    billing.plan === 'free'
      ? `En Free, el audio consume créditos. Costo estimado: 2 créditos por minuto. Saldo actual: ${billing.credits}.`
      : 'Con Premium, podés usar audio sin consumir créditos obligatorios.';

  if (isProcessing) {
    return <ProcessingScreen type="audio" />;
  }

  if (result) {
    return (
      <PdfResultScreen
        fileName={recordingName}
        fileSize={recordingSize}
        result={result}
        onBack={handleBack}
        sourceType="audio"
      />
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Grabar clase</Text>
      <Text style={styles.subtitle}>
        Grabá una clase o explicación, detené la grabación y generá resumen, preguntas,
        flashcards y examen.
      </Text>

      <View style={styles.noticeCard}>
        <Text style={styles.noticeTitle}>
          {billing.plan === 'free' ? 'Plan Free' : 'Premium'}
        </Text>
        <Text style={styles.noticeText}>{freeAudioText}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Estado</Text>
        <Text style={styles.value}>
          {recorderState.isRecording ? 'Grabando...' : 'Listo para grabar'}
        </Text>

        <Text style={styles.label}>Duración</Text>
        <Text style={styles.timer}>{formatDuration(recorderState.durationMillis || 0)}</Text>
      </View>

      {!recorderState.isRecording ? (
        <Pressable style={styles.primaryButton} onPress={handleStartRecording}>
          <Text style={styles.primaryButtonText}>Empezar grabación</Text>
        </Pressable>
      ) : (
        <Pressable style={styles.stopButton} onPress={handleStopAndAnalyze}>
          <Text style={styles.stopButtonText}>Detener y analizar</Text>
        </Pressable>
      )}

      <Pressable style={styles.secondaryButton} onPress={handleBack}>
        <Text style={styles.secondaryButtonText}>Volver</Text>
      </Pressable>

      <View style={styles.tipCard}>
        <Text style={styles.tipTitle}>Consejo</Text>
        <Text style={styles.tipText}>
          Dejá el teléfono cerca del profesor o de la fuente de audio para mejorar la
          transcripción.
        </Text>
      </View>
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
    marginBottom: 20,
  },
  label: {
    color: '#94a3b8',
    fontSize: 13,
    marginBottom: 6,
  },
  value: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  timer: {
    color: '#93c5fd',
    fontSize: 34,
    fontWeight: '800',
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
  stopButton: {
    backgroundColor: '#dc2626',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 12,
  },
  stopButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  secondaryButtonText: {
    color: '#cbd5e1',
    fontSize: 16,
    fontWeight: '700',
  },
  tipCard: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 18,
  },
  tipTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  tipText: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 22,
  },
});