import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AppBottomNav from '../components/AppBottomNav';
import PdfResultScreen from '../components/PdfResultScreen';
import { getHistoryItemById, HistoryItem } from '../services/historyStorage';
import { APP_COLORS } from '../constants/theme';

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
    <View style={styles.screen}>
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

      <AppBottomNav activeTab="history" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
  },
  centered: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    color: APP_COLORS.text,
    fontSize: 18,
    fontWeight: '600',
  },
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
    content: {
      paddingBottom: 280,
    },
  title: {
    color: APP_COLORS.text,
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
    width: '100%',
  },
  subtitle: {
    color: APP_COLORS.textMuted,
    fontSize: 14,
    marginBottom: 18,
    textAlign: 'center',
    width: '100%',
  },
  card: {
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
    fontWeight: '700',
    marginBottom: 12,
  },
  bodyText: {
    color: APP_COLORS.textMuted,
    fontSize: 15,
    lineHeight: 24,
  },
  topicChip: {
    backgroundColor: APP_COLORS.background,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: APP_COLORS.creamSoft,
  },
  topicChipText: {
    color: APP_COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  bigNumber: {
    color: APP_COLORS.text,
    fontSize: 38,
    fontWeight: '800',
  },
  primaryButton: {
    backgroundColor: APP_COLORS.text,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
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
