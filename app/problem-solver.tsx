import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AppBottomNav from '../components/AppBottomNav';
import ProcessingScreen from '../components/ProcessingScreen';
import { analyzeProblem } from '../services/problemSolverApi';

type SelectedProblemImage = {
  uri: string;
  name: string;
  mimeType: string;
  webFile?: File;
};

type ProblemSolution = {
  title: string;
  summary: string;
  steps: string[];
  finalAnswer: string;
  tips?: string[];
};

export default function ProblemSolverScreen() {
  const [image, setImage] = useState<SelectedProblemImage | null>(null);
  const [description, setDescription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [solution, setSolution] = useState<ProblemSolution | null>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setImage({
        uri: asset.uri,
        name: asset.fileName || `problema-${Date.now()}.jpg`,
        mimeType: asset.mimeType || 'image/jpeg',
        webFile: (asset as { file?: File }).file,
      });
      setSolution(null);
    }
  };

  const handleAnalyzeProblem = async () => {
    if (!image) {
      Alert.alert('Falta la foto', 'Primero elige una imagen del problema.');
      return;
    }

    try {
      setIsProcessing(true);

      const formData = new FormData();
      formData.append('description', description.trim());

      if (Platform.OS === 'web') {
        if (!image.webFile) {
          throw new Error('En web no se encontro el archivo real del problema.');
        }

        formData.append('image', image.webFile);
      } else {
        formData.append(
          'image',
          {
            uri: image.uri,
            name: image.name,
            type: image.mimeType,
          } as never
        );
      }

      const data = await analyzeProblem(formData, {
        description: description.trim(),
        fileName: image.name,
      });
      setSolution(data);
    } catch (error) {
      console.error('Error resolviendo problema:', error);
      const message = error instanceof Error ? error.message : 'No se pudo analizar el problema.';
      Alert.alert('Error', message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isProcessing) {
    return <ProcessingScreen type="problema" />;
  }

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Resolver problemas</Text>
        <Text style={styles.subtitle}>
          Saca una foto de un ejercicio de matematicas, fisica o quimica y prepararemos una
          correccion paso a paso.
        </Text>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Foto del problema</Text>
          <Text style={styles.bodyText}>
            Sube una imagen para analizar si la respuesta esta bien y ver el proceso completo.
          </Text>

          <Pressable style={styles.secondaryButton} onPress={pickImage}>
            <Text style={styles.secondaryButtonText}>
              {image ? 'Cambiar foto' : 'Elegir foto'}
            </Text>
          </Pressable>

          {image ? (
            <Image source={{ uri: image.uri }} style={styles.preview} resizeMode="cover" />
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Descripcion opcional</Text>
          <Text style={styles.bodyText}>
            Puedes escribir el enunciado o aclarar que parte quieres revisar.
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Escribe el problema o una pista"
            placeholderTextColor="#64748b"
            style={styles.input}
            multiline
          />
        </View>

        {solution ? (
          <View style={styles.solutionCard}>
            <Text style={styles.sectionTitle}>{solution.title}</Text>
            <Text style={styles.bodyText}>{solution.summary}</Text>

            <View style={styles.solutionBlock}>
              <Text style={styles.solutionLabel}>Pasos</Text>
              {solution.steps.map((step, index) => (
                <View key={`${index}-${step}`} style={styles.stepItem}>
                  <Text style={styles.stepText}>
                    {index + 1}. {step}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.solutionBlock}>
              <Text style={styles.solutionLabel}>Respuesta final</Text>
              <Text style={styles.finalAnswer}>{solution.finalAnswer}</Text>
            </View>

            {Array.isArray(solution.tips) && solution.tips.length > 0 ? (
              <View style={styles.solutionBlock}>
                <Text style={styles.solutionLabel}>Consejos</Text>
                {solution.tips.map((tip, index) => (
                  <Text key={`${index}-${tip}`} style={styles.tipText}>
                    - {tip}
                  </Text>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        <Pressable
          style={[styles.primaryButton, !image && styles.disabledButton]}
          onPress={handleAnalyzeProblem}
          disabled={!image}
        >
          <Text style={styles.primaryButtonText}>Analizar problema</Text>
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
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 260,
  },
  title: {
    color: 'white',
    fontSize: 34,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
    width: '100%',
  },
  subtitle: {
    color: '#cbd5e1',
    fontSize: 17,
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center',
    width: '100%',
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
    fontWeight: '800',
    marginBottom: 8,
  },
  bodyText: {
    color: '#cbd5e1',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 14,
  },
  secondaryButton: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#cbd5e1',
    fontWeight: '800',
    fontSize: 16,
  },
  preview: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#0f172a',
    color: 'white',
    minHeight: 110,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  solutionCard: {
    backgroundColor: '#111827',
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
  },
  solutionBlock: {
    marginTop: 14,
  },
  solutionLabel: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  stepItem: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  stepText: {
    color: '#e2e8f0',
    fontSize: 14,
    lineHeight: 22,
  },
  finalAnswer: {
    color: '#dbeafe',
    fontSize: 15,
    lineHeight: 24,
  },
  tipText: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 4,
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.55,
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 16,
  },
});
