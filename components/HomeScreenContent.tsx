import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { APP_COLORS } from '../constants/theme';
import { StudyProgress } from '../services/studyProgressStorage';

type Props = {
  onFilePress: () => void;
  onExamModelPress: () => void;
  onFlashcardsHistoryPress: () => void;
  onProblemSolverPress: () => void;
  onTutorPress: () => void;
  onStudyRoutePress: () => void;
  onMarkStudyPress: () => void;
  studyProgress: StudyProgress | null;
};

export default function HomeScreenContent({
  onFilePress,
  onExamModelPress,
  onFlashcardsHistoryPress,
  onProblemSolverPress,
  onTutorPress,
  onStudyRoutePress,
  onMarkStudyPress,
  studyProgress,
}: Props) {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Studyo Ai</Text>
      <Text style={styles.subtitle}>
        Convierte clases, archivos, imágenes y exámenes en material de estudio.
      </Text>

      {studyProgress ? (
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View style={styles.progressHeaderText}>
              <Text style={styles.progressLabel}>Progreso de hoy</Text>
              <Text style={styles.progressTitle}>
                {studyProgress.completedToday
                  ? 'Ya completaste una sesión'
                  : 'Todavía puedes sumar una sesión'}
              </Text>
            </View>

            <View style={styles.progressBadge}>
              <Text style={styles.progressBadgeText}>{studyProgress.streakDays} días</Text>
            </View>
          </View>

          <View style={styles.progressStatsRow}>
            <View style={styles.progressStat}>
              <Text style={styles.progressStatLabel}>Sesiones</Text>
              <Text style={styles.progressStatValue}>{studyProgress.totalSessions}</Text>
            </View>

            <View style={styles.progressStat}>
              <Text style={styles.progressStatLabel}>Último estudio</Text>
              <Text style={styles.progressStatValue}>{studyProgress.lastStudyLabel}</Text>
            </View>

            <View style={styles.progressStat}>
              <Text style={styles.progressStatLabel}>Recordatorio</Text>
              <Text style={styles.progressStatValue}>
                {studyProgress.reminderEnabled
                  ? `A las ${studyProgress.reminderTimeLabel}`
                  : 'Apagado'}
              </Text>
            </View>
          </View>

          <Pressable
            style={styles.progressButton}
            onPress={onMarkStudyPress}
          >
            <Text style={styles.progressButtonText}>
              {studyProgress.completedToday ? 'Sumar otra sesión' : 'Marcar estudio de hoy'}
            </Text>
          </Pressable>
        </View>
      ) : null}

      <Pressable style={styles.featureBanner} onPress={onStudyRoutePress}>
        <View style={styles.featureBannerText}>
          <Text style={styles.featureLabel}>Ruta de estudio</Text>
          <Text style={styles.featureTitle}>Tu siguiente paso, claro y simple</Text>
          <Text style={styles.featureText}>
            La app te arma un plan corto con resumen, práctica y repaso inteligente.
          </Text>
        </View>
      </Pressable>

      <View style={styles.cardContainer}>
        <Pressable style={styles.card} onPress={onFilePress}>
          <Text style={styles.cardEmoji}>Archivo</Text>
          <Text style={styles.cardTitle}>Centro de carga</Text>
          <Text style={styles.cardText}>
            Sube texto, PDF, imágenes o audio desde un solo lugar para generar material de
            estudio.
          </Text>
        </Pressable>

        <Pressable style={styles.card} onPress={onExamModelPress}>
          <Text style={styles.cardEmoji}>Exam</Text>
          <Text style={styles.cardTitle}>Subir exámenes</Text>
          <Text style={styles.cardText}>
            Analiza exámenes anteriores y genera uno nuevo con estilo similar.
          </Text>
        </Pressable>

        <Pressable style={styles.card} onPress={onProblemSolverPress}>
          <Text style={styles.cardEmoji}>Solve</Text>
          <Text style={styles.cardTitle}>Resolver problemas</Text>
          <Text style={styles.cardText}>
            Saca una foto de matemáticas, física o química y recibe una corrección paso a paso.
          </Text>
        </Pressable>

        <Pressable style={styles.card} onPress={onTutorPress}>
          <Text style={styles.cardEmoji}>Tutor</Text>
          <Text style={styles.cardTitle}>Tutor</Text>
          <Text style={styles.cardText}>
            Chatea con la IA para que te explique temas con ejemplos, fórmulas y resueltos.
          </Text>
        </Pressable>

        <Pressable style={styles.card} onPress={onFlashcardsHistoryPress}>
          <Text style={styles.cardEmoji}>Cards</Text>
          <Text style={styles.cardTitle}>Flashcards</Text>
          <Text style={styles.cardText}>
            Abre el historial de flashcards generadas y estudia cuando quieras.
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 280,
  },
  title: {
    color: APP_COLORS.text,
    fontSize: 34,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    color: APP_COLORS.textMuted,
    fontSize: 17,
    lineHeight: 24,
    marginBottom: 18,
  },
  progressCard: {
    backgroundColor: APP_COLORS.surfaceAlt,
    borderRadius: 22,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: APP_COLORS.creamSoft,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  progressHeaderText: {
    flex: 1,
    gap: 4,
  },
  progressLabel: {
    color: APP_COLORS.textMuted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  progressTitle: {
    color: APP_COLORS.text,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
  },
  progressBadge: {
    backgroundColor: APP_COLORS.surfaceDeep,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  progressBadgeText: {
    color: APP_COLORS.text,
    fontSize: 13,
    fontWeight: '800',
  },
  progressStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  progressStat: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: APP_COLORS.creamSoft,
  },
  progressStatLabel: {
    color: APP_COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  progressStatValue: {
    color: APP_COLORS.text,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
  },
  progressButton: {
    backgroundColor: APP_COLORS.text,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  progressButtonDisabled: {
    opacity: 0.72,
  },
  progressButtonText: {
    color: APP_COLORS.accentText,
    fontSize: 15,
    fontWeight: '800',
  },
  featureBanner: {
    backgroundColor: APP_COLORS.surfaceDeep,
    borderRadius: 22,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: APP_COLORS.creamSoft,
  },
  featureBannerText: {
    gap: 6,
  },
  featureLabel: {
    color: APP_COLORS.textMuted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  featureTitle: {
    color: APP_COLORS.text,
    fontSize: 20,
    fontWeight: '800',
  },
  featureText: {
    color: APP_COLORS.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  cardContainer: {
    gap: 16,
  },
  card: {
    backgroundColor: APP_COLORS.surface,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: APP_COLORS.creamSoft,
  },
  cardEmoji: {
    color: APP_COLORS.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 10,
  },
  cardTitle: {
    color: APP_COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardText: {
    color: APP_COLORS.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
});
