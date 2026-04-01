import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import PdfResultScreen from '../components/PdfResultScreen';
import { getHistoryItemById, HistoryItem } from '../services/historyStorage';

export default function SavedItemScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const [item, setItem] = useState<HistoryItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        if (!params.id || typeof params.id !== 'string') {
          Alert.alert('Error', 'No se encontró el elemento guardado.');
          router.back();
          return;
        }

        const found = await getHistoryItemById(params.id);

        if (!found) {
          Alert.alert('Error', 'Este elemento ya no existe en el historial.');
          router.back();
          return;
        }

        setItem(found);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [params.id]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>No se encontró el elemento.</Text>
      </View>
    );
  }

  if (item.payload.kind === 'study-result') {
    return (
      <PdfResultScreen
        fileName={item.payload.fileName}
        fileSize={item.payload.fileSize}
        result={item.payload.result}
        onBack={() => router.back()}
        sourceType={item.payload.sourceType}
      />
    );
  }

  const payload = item.payload;

  const openGeneratedExam = () => {
    router.push({
      pathname: '/exam',
      params: {
        exam: JSON.stringify(payload.questions),
      },
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.subtitle}>
        Guardado el {new Date(item.createdAt).toLocaleString()}
      </Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Temas detectados</Text>
        {payload.detectedTopics.map((topic, index) => (
          <View key={index} style={styles.topicChip}>
            <Text style={styles.topicChipText}>{topic}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Estilo detectado</Text>
        <Text style={styles.bodyText}>{payload.examStyle}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Preguntas estimadas</Text>
        <Text style={styles.bigNumber}>{payload.estimatedQuestions}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Examen generado</Text>
        <Text style={styles.bodyText}>
          Este modelo guardado contiene {payload.questions.length} preguntas.
        </Text>
      </View>

      <Pressable style={styles.primaryButton} onPress={openGeneratedExam}>
        <Text style={styles.primaryButtonText}>Abrir examen generado</Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
        <Text style={styles.secondaryButtonText}>Volver</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingHorizontal: 20,
    paddingTop: 80,
  },
  content: {
    paddingBottom: 40,
  },
  title: {
    color: 'white',
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 18,
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
