import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AppBottomNav from '../components/AppBottomNav';
import { APP_COLORS } from '../constants/theme';
import { getHistoryItems } from '../services/historyStorage';
import {
  buildStudyRouteFromHistory,
  type StudyRoute,
} from '../services/studyRoute';
import {
  disableStudyReminder,
  enableStudyReminder,
} from '../services/studyReminderService';
import {
  getStudyProgress,
  markStudySession,
  type StudyProgress,
} from '../services/studyProgressStorage';

export default function StudyRouteScreen() {
  const [routePlan, setRoutePlan] = useState<StudyRoute | null>(null);
  const [studyProgress, setStudyProgress] = useState<StudyProgress | null>(null);
  const [savingSession, setSavingSession] = useState(false);
  const [savingReminder, setSavingReminder] = useState(false);

  const loadScreenData = useCallback(async () => {
    const [items, progress] = await Promise.all([getHistoryItems(), getStudyProgress()]);
    setRoutePlan(buildStudyRouteFromHistory(items));
    setStudyProgress(progress);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadScreenData();
    }, [loadScreenData])
  );

  const openTutor = () => {
    router.push('/tutor' as never);
  };

  const openHistory = () => {
    router.push('/(tabs)/explore' as never);
  };

  const handleMarkStudy = async () => {
    try {
      setSavingSession(true);
      const updated = await markStudySession();
      setStudyProgress(updated);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo guardar la sesión.';
      Alert.alert('Error', message);
    } finally {
      setSavingSession(false);
    }
  };

  const handleReminderToggle = async () => {
    try {
      setSavingReminder(true);

      const updated = studyProgress?.reminderEnabled
        ? await disableStudyReminder()
        : await enableStudyReminder();

      setStudyProgress(updated);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No se pudo cambiar el recordatorio.';
      Alert.alert('Recordatorio', message);
    } finally {
      setSavingReminder(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Ruta de estudio</Text>
        <Text style={styles.subtitle}>
          Esta es tu siguiente jugada: una secuencia corta para entender, practicar y fijar el
          tema.
        </Text>

        {studyProgress ? (
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <View style={styles.progressHeaderText}>
                <Text style={styles.progressLabel}>Progreso actual</Text>
                <Text style={styles.progressTitle}>
                  {studyProgress.completedToday
                    ? 'Ya hiciste tu sesión de hoy'
                    : 'Todavía puedes cerrar una sesión hoy'}
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
              style={[styles.primaryButton, savingSession && styles.buttonDisabled]}
              onPress={handleMarkStudy}
              disabled={savingSession}
            >
              <Text style={styles.primaryButtonText}>
                {savingSession
                  ? 'Guardando...'
                  : studyProgress.completedToday
                  ? 'Sumar otra sesión'
                  : 'Marcar estudio de hoy'}
              </Text>
            </Pressable>

            <Pressable
              style={[styles.secondaryButton, savingReminder && styles.buttonDisabled]}
              onPress={handleReminderToggle}
              disabled={savingReminder}
            >
              <Text style={styles.secondaryButtonText}>
                {savingReminder
                  ? 'Actualizando...'
                  : studyProgress.reminderEnabled
                  ? 'Desactivar recordatorio'
                  : `Activar recordatorio diario a las ${studyProgress.reminderTimeLabel}`}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {!routePlan ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Todavía no hay material para armar una ruta</Text>
            <Text style={styles.emptyText}>
              Sube un archivo, imagen, audio o un examen para que la app te prepare un plan.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.heroCard}>
              <Text style={styles.heroLabel}>{routePlan.sourceLabel}</Text>
              <Text style={styles.heroTitle}>{routePlan.sourceName}</Text>
              <Text style={styles.heroText}>{routePlan.summary}</Text>
              <Text style={styles.heroNote}>{routePlan.nextAction}</Text>
            </View>

            <View style={styles.stepsHeader}>
              <Text style={styles.sectionTitle}>Pasos recomendados</Text>
              <Text style={styles.sectionCounter}>{routePlan.steps.length} pasos</Text>
            </View>

            {routePlan.steps.map((step, index) => (
              <View key={`${index}-${step.title}`} style={styles.stepCard}>
                <View style={styles.stepIndex}>
                  <Text style={styles.stepIndexText}>{index + 1}</Text>
                </View>
                <View style={styles.stepBody}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepText}>{step.description}</Text>
                </View>
              </View>
            ))}

            <View style={styles.actionCard}>
              <Text style={styles.sectionTitle}>Siguiente movimiento</Text>
              <Text style={styles.actionText}>
                Usa el Tutor si algo no te queda claro, o vuelve al historial para abrir el
                material exacto de esta ruta.
              </Text>

              <Pressable style={styles.actionButton} onPress={openTutor}>
                <Ionicons name="chatbubble-ellipses-outline" size={18} color={APP_COLORS.accentText} />
                <Text style={styles.actionButtonText}>Abrir Tutor</Text>
              </Pressable>

              <Pressable style={styles.secondaryActionButton} onPress={openHistory}>
                <Text style={styles.secondaryActionButtonText}>Ver historial</Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>

      <AppBottomNav activeTab="home" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 260,
  },
  title: {
    color: APP_COLORS.text,
    fontSize: 34,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    color: APP_COLORS.textMuted,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 22,
  },
  progressCard: {
    backgroundColor: APP_COLORS.surfaceAlt,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: APP_COLORS.creamSoft,
    marginBottom: 16,
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
  primaryButton: {
    backgroundColor: APP_COLORS.text,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonDisabled: {
    opacity: 0.72,
  },
  primaryButtonText: {
    color: APP_COLORS.accentText,
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryButton: {
    backgroundColor: APP_COLORS.surface,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: APP_COLORS.creamSoft,
  },
  secondaryButtonText: {
    color: APP_COLORS.text,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  heroCard: {
    backgroundColor: APP_COLORS.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: APP_COLORS.creamSoft,
    marginBottom: 16,
  },
  heroLabel: {
    color: APP_COLORS.textMuted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  heroTitle: {
    color: APP_COLORS.text,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 10,
  },
  heroText: {
    color: APP_COLORS.text,
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 10,
  },
  heroNote: {
    color: APP_COLORS.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
  stepsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    color: APP_COLORS.text,
    fontSize: 22,
    fontWeight: '800',
  },
  sectionCounter: {
    color: APP_COLORS.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  stepCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: APP_COLORS.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: APP_COLORS.creamSoft,
  },
  stepIndex: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: APP_COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: APP_COLORS.creamSoft,
  },
  stepIndexText: {
    color: APP_COLORS.text,
    fontSize: 14,
    fontWeight: '800',
  },
  stepBody: {
    flex: 1,
  },
  stepTitle: {
    color: APP_COLORS.text,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  stepText: {
    color: APP_COLORS.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
  actionCard: {
    backgroundColor: APP_COLORS.surface,
    borderRadius: 20,
    padding: 20,
    marginTop: 6,
    borderWidth: 1,
    borderColor: APP_COLORS.creamSoft,
  },
  actionText: {
    color: APP_COLORS.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: APP_COLORS.text,
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 10,
  },
  actionButtonText: {
    color: APP_COLORS.accentText,
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryActionButton: {
    backgroundColor: APP_COLORS.background,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: APP_COLORS.creamSoft,
  },
  secondaryActionButtonText: {
    color: APP_COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: APP_COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: APP_COLORS.creamSoft,
    padding: 20,
  },
  emptyTitle: {
    color: APP_COLORS.text,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  emptyText: {
    color: APP_COLORS.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
});
