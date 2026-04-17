import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AppBottomNav from '../components/AppBottomNav';
import PdfResultScreen from '../components/PdfResultScreen';
import { useAppPreferences } from '../contexts/AppPreferencesContext';
import { getHistoryItemById, HistoryItem } from '../services/historyStorage';

export default function SavedItemScreen() {
  const { colors, t } = useAppPreferences();
  const params = useLocalSearchParams<{ id?: string }>();
  const [item, setItem] = useState<HistoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    const load = async () => {
      try {
        if (!params.id || typeof params.id !== 'string') {
          Alert.alert('Error', t('saved.notFoundAlert'));
          router.back();
          return;
        }

        const found = await getHistoryItemById(params.id);

        if (!found) {
          Alert.alert('Error', t('saved.missing'));
          router.back();
          return;
        }

        setItem(found);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [params.id, t]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>{t('saved.loading')}</Text>
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>{t('saved.notFound')}</Text>
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
          <Text style={styles.sectionTitle}>{t('saved.examTopics')}</Text>
          {payload.detectedTopics.map((topic, index) => (
            <View key={index} style={styles.topicChip}>
              <Text style={styles.topicChipText}>{topic}</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('saved.examStyle')}</Text>
          <Text style={styles.bodyText}>{payload.examStyle}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('saved.examEstimate')}</Text>
          <Text style={styles.bigNumber}>{payload.estimatedQuestions}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('saved.examGenerated')}</Text>
          <Text style={styles.bodyText}>
            Este modelo guardado contiene {payload.questions.length} preguntas.
          </Text>
        </View>

        <Pressable style={styles.primaryButton} onPress={openGeneratedExam}>
          <Text style={styles.primaryButtonText}>{t('saved.openExam')}</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
          <Text style={styles.secondaryButtonText}>{t('saved.back')}</Text>
        </Pressable>
      </ScrollView>

      <AppBottomNav activeTab="history" />
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useAppPreferences>['colors']) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centered: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    loadingText: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '600',
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: 20,
      paddingTop: 24,
    },
    content: {
      paddingBottom: 160,
    },
    title: {
      color: colors.text,
      fontSize: 30,
      fontWeight: '800',
      marginBottom: 8,
      textAlign: 'center',
      width: '100%',
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: 14,
      marginBottom: 18,
      textAlign: 'center',
      width: '100%',
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
