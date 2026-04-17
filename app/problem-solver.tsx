import * as ImagePicker from 'expo-image-picker';
import { useMemo, useState } from 'react';
import { Alert, Image, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import AppBottomNav from '../components/AppBottomNav';
import ProcessingScreen from '../components/ProcessingScreen';
import { useAppPreferences } from '../contexts/AppPreferencesContext';
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
  const { colors, t } = useAppPreferences();
  const [image, setImage] = useState<SelectedProblemImage | null>(null);
  const [description, setDescription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [solution, setSolution] = useState<ProblemSolution | null>(null);

  const styles = useMemo(() => createStyles(colors), [colors]);

  const pickImageFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(t('problem.permissionTitle'), t('problem.permissionLibrary'));
      return;
    }

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

  const takePhoto = async () => {
    if (Platform.OS === 'web') {
      await pickImageFromLibrary();
      return;
    }

    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(t('problem.permissionTitle'), t('problem.permissionCamera'));
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
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

  const handleChoosePhoto = async () => {
    if (Platform.OS === 'web') {
      await pickImageFromLibrary();
      return;
    }

    Alert.alert(t('problem.photoActionTitle'), t('problem.photoActionText'), [
      { text: t('problem.uploadPhoto'), onPress: () => void pickImageFromLibrary() },
      { text: t('problem.takePhoto'), onPress: () => void takePhoto() },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
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
          throw new Error('En web no se encontró el archivo real del problema.');
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
        <Text style={styles.title}>{t('problem.title')}</Text>
        <Text style={styles.subtitle}>{t('problem.subtitle')}</Text>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('problem.photoTitle')}</Text>
          <Text style={styles.bodyText}>{t('problem.photoText')}</Text>

          <Pressable style={styles.secondaryButton} onPress={handleChoosePhoto}>
            <Text style={styles.secondaryButtonText}>
              {image ? t('problem.changePhoto') : t('problem.uploadPhoto')}
            </Text>
          </Pressable>

          {image ? (
            <Image source={{ uri: image.uri }} style={styles.preview} resizeMode="cover" />
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('problem.descriptionTitle')}</Text>
          <Text style={styles.bodyText}>{t('problem.descriptionText')}</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder={t('problem.descriptionPlaceholder')}
            placeholderTextColor={colors.textMuted}
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
          <Text style={styles.primaryButtonText}>{t('problem.analyze')}</Text>
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
      fontWeight: '800',
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
      fontWeight: '800',
      marginBottom: 8,
    },
    bodyText: {
      color: colors.textMuted,
      fontSize: 15,
      lineHeight: 22,
      marginBottom: 14,
    },
    secondaryButton: {
      backgroundColor: colors.background,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.creamSoft,
    },
    secondaryButtonText: {
      color: colors.text,
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
      backgroundColor: colors.background,
      color: colors.text,
      minHeight: 110,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
      borderWidth: 1,
      borderColor: colors.creamSoft,
    },
    solutionCard: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 18,
      marginBottom: 18,
      borderWidth: 1,
      borderColor: colors.creamSoft,
    },
    solutionBlock: {
      marginTop: 14,
    },
    solutionLabel: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '800',
      marginBottom: 8,
    },
    stepItem: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 12,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.creamSoft,
    },
    stepText: {
      color: colors.text,
      fontSize: 14,
      lineHeight: 22,
    },
    finalAnswer: {
      color: colors.text,
      fontSize: 15,
      lineHeight: 24,
    },
    tipText: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 22,
      marginBottom: 4,
    },
    primaryButton: {
      backgroundColor: colors.cream,
      borderRadius: 16,
      paddingVertical: 16,
      alignItems: 'center',
    },
    disabledButton: {
      opacity: 0.55,
    },
    primaryButtonText: {
      color: colors.accentText,
      fontWeight: '800',
      fontSize: 16,
    },
  });
}
