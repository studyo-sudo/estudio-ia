import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useAppPreferences } from '../contexts/AppPreferencesContext';

type Props = {
  type?: 'archivo' | 'imagen' | 'audio' | 'examen' | 'problema';
};

export default function ProcessingScreen({ type = 'archivo' }: Props) {
  const { colors, t } = useAppPreferences();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const title =
    type === 'imagen'
      ? t('processing.image')
      : type === 'audio'
      ? t('processing.audio')
      : type === 'examen'
      ? t('processing.exam')
      : type === 'problema'
      ? t('processing.problem')
      : t('processing.file');

  const subtitle =
    type === 'imagen'
      ? t('processing.imageText')
      : type === 'audio'
      ? t('processing.audioText')
      : type === 'examen'
      ? t('processing.examText')
      : type === 'problema'
      ? t('processing.problemText')
      : t('processing.fileText');

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <ActivityIndicator size="large" color={colors.text} />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useAppPreferences>['colors']) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    card: {
      width: '100%',
      maxWidth: 380,
      backgroundColor: colors.surface,
      borderRadius: 20,
      paddingVertical: 28,
      paddingHorizontal: 22,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.creamSoft,
    },
    title: {
      color: colors.text,
      fontSize: 26,
      fontWeight: '800',
      marginTop: 18,
      marginBottom: 10,
      textAlign: 'center',
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: 15,
      lineHeight: 24,
      textAlign: 'center',
    },
  });
}
