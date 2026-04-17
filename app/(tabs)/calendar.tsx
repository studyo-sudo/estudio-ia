import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AppColors } from '../../constants/theme';
import { useAppPreferences } from '../../contexts/AppPreferencesContext';
import {
  CalendarEntry,
  createCalendarEntry,
  deleteCalendarEntry,
  formatCalendarDateKey,
  formatCalendarDateLabel,
  formatCalendarHour,
  getCalendarEntries,
  saveCalendarEntry,
} from '../../services/calendarStorage';
import {
  REMINDER_OPTIONS,
  cancelCalendarReminder,
  formatReminderLabel,
  scheduleCalendarReminder,
} from '../../services/calendarNotifications';

type CalendarCell = {
  date: Date;
  dateKey: string;
  inCurrentMonth: boolean;
};

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12, 0, 0, 0);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1, 12, 0, 0, 0);
}

function getDateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function getMonthLabel(date: Date, locale: string) {
  return capitalize(date.toLocaleDateString(locale, { month: 'long', year: 'numeric' }));
}

function getLongDateLabel(dateKey: string) {
  return formatCalendarDateLabel(dateKey);
}

function getMonthGrid(monthDate: Date): CalendarCell[] {
  const firstDayOfMonth = startOfMonth(monthDate);
  const mondayOffset = (firstDayOfMonth.getDay() + 6) % 7;
  const startDate = new Date(
    firstDayOfMonth.getFullYear(),
    firstDayOfMonth.getMonth(),
    firstDayOfMonth.getDate() - mondayOffset,
    12,
    0,
    0,
    0
  );

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);

    return {
      date,
      dateKey: getDateKey(date),
      inCurrentMonth: date.getMonth() === monthDate.getMonth(),
    };
  });
}

export default function CalendarScreen() {
  const today = new Date();
  const todayKey = formatCalendarDateKey(today);

  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey);
  const [monthCursor, setMonthCursor] = useState(() => startOfMonth(today));
  const [editorVisible, setEditorVisible] = useState(false);
  const [reminderVisible, setReminderVisible] = useState(false);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [draftText, setDraftText] = useState('');
  const [editingEntry, setEditingEntry] = useState<CalendarEntry | null>(null);
  const [pendingReminderEntry, setPendingReminderEntry] = useState<CalendarEntry | null>(null);
  const [selectedReminderMinutes, setSelectedReminderMinutes] = useState<number | 'custom'>(60);
  const [customReminderMinutes, setCustomReminderMinutes] = useState('90');
  const [saving, setSaving] = useState(false);
  const { colors, locale, t } = useAppPreferences();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    const storedEntries = await getCalendarEntries();
    setEntries(storedEntries);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadEntries();
    }, [loadEntries])
  );

  const entriesByDate = useMemo(() => {
    const map = new Map<string, CalendarEntry[]>();

    for (const entry of entries) {
      const list = map.get(entry.dateKey) ?? [];
      list.push(entry);
      map.set(entry.dateKey, list);
    }

    for (const list of map.values()) {
      list.sort((a, b) => a.hour - b.hour);
    }

    return map;
  }, [entries]);

  const selectedDayEntries = useMemo(
    () => entriesByDate.get(selectedDateKey) ?? [],
    [entriesByDate, selectedDateKey]
  );

  const monthGrid = useMemo(() => getMonthGrid(monthCursor), [monthCursor]);
  const selectedDateLabel = useMemo(() => getLongDateLabel(selectedDateKey), [selectedDateKey]);
  const monthLabel = useMemo(() => getMonthLabel(monthCursor, locale), [monthCursor, locale]);
  const hasEntries = selectedDayEntries.length > 0;

  const openHourEditor = useCallback(
    (hour: number) => {
      const existing = selectedDayEntries.find((entry) => entry.hour === hour) ?? null;
      setSelectedHour(hour);
      setEditingEntry(existing);
      setDraftText(existing?.text ?? '');
      setEditorVisible(true);
    },
    [selectedDayEntries]
  );

  const applyNoReminder = useCallback(
    async (entry: CalendarEntry) => {
      try {
        setSaving(true);
        await scheduleCalendarReminder(entry, null, entry.notificationId);
        await saveCalendarEntry({
          ...entry,
          reminderMinutesBefore: null,
          notificationId: null,
          updatedAt: Date.now(),
        });
        await loadEntries();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'No se pudo desactivar el recordatorio.';
        Alert.alert('Error', message);
      } finally {
        setSaving(false);
        setReminderVisible(false);
        setPendingReminderEntry(null);
        setSelectedReminderMinutes(60);
        setCustomReminderMinutes('90');
      }
    },
    [loadEntries]
  );

  const handleSaveEntry = useCallback(async () => {
    if (selectedHour === null) {
      return;
    }

    const normalizedText = draftText.trim();

    if (!normalizedText) {
      Alert.alert('Falta texto', 'Escribe algo para guardar en esta hora.');
      return;
    }

    try {
      setSaving(true);

      const nextEntry = createCalendarEntry(
        selectedDateKey,
        selectedHour,
        normalizedText,
        editingEntry ?? undefined
      );

      const savedEntry = await saveCalendarEntry(nextEntry);
      await loadEntries();
      setEditorVisible(false);
      setSelectedHour(null);
      setEditingEntry(null);
      setPendingReminderEntry(savedEntry);
      setSelectedReminderMinutes(savedEntry.reminderMinutesBefore ?? 60);
      setCustomReminderMinutes(String(savedEntry.reminderMinutesBefore ?? 90));
      setSaving(false);

      Alert.alert('Recordatorio', 'Quieres que te recuerde esto?', [
        {
          text: 'No',
          style: 'cancel',
          onPress: () => {
            void applyNoReminder(savedEntry);
          },
        },
        {
          text: 'SÃ­',
          onPress: () => {
            setPendingReminderEntry(savedEntry);
            setReminderVisible(true);
          },
        },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo guardar el texto.';
      Alert.alert('Error', message);
      setSaving(false);
    }
  }, [applyNoReminder, draftText, editingEntry, loadEntries, selectedDateKey, selectedHour]);

  const handleConfirmReminder = useCallback(async () => {
    if (!pendingReminderEntry) {
      return;
    }

    const reminderMinutes =
      selectedReminderMinutes === 'custom'
        ? Number(customReminderMinutes.trim())
        : selectedReminderMinutes;

    if (!Number.isFinite(reminderMinutes) || reminderMinutes < 0) {
      Alert.alert('Dato invalido', 'Ingresa una cantidad valida de minutos.');
      return;
    }

    try {
      setSaving(true);
      const notificationId = await scheduleCalendarReminder(
        pendingReminderEntry,
        reminderMinutes,
        pendingReminderEntry.notificationId
      );

      await saveCalendarEntry({
        ...pendingReminderEntry,
        reminderMinutesBefore: reminderMinutes,
        notificationId,
        updatedAt: Date.now(),
      });

      await loadEntries();
      setReminderVisible(false);
      setPendingReminderEntry(null);
      setSelectedReminderMinutes(60);
      setCustomReminderMinutes('90');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No se pudo crear el recordatorio.';
      Alert.alert('Error', message);
    } finally {
      setSaving(false);
    }
  }, [customReminderMinutes, loadEntries, pendingReminderEntry, selectedReminderMinutes]);

  const handleDeleteEntry = useCallback(() => {
    if (!editingEntry) {
      return;
    }

    Alert.alert('Eliminar texto', 'Quieres borrar este texto y su recordatorio?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              setSaving(true);
              await cancelCalendarReminder(editingEntry.notificationId);
              await deleteCalendarEntry(editingEntry.id);
              await loadEntries();
              setEditorVisible(false);
              setSelectedHour(null);
              setEditingEntry(null);
            } catch (error) {
              const message =
                error instanceof Error ? error.message : 'No se pudo eliminar el texto.';
              Alert.alert('Error', message);
            } finally {
              setSaving(false);
            }
          })();
        },
      },
    ]);
  }, [editingEntry, loadEntries]);

  const goToMonth = useCallback(
    (offset: number) => {
      const nextMonth = startOfMonth(addMonths(monthCursor, offset));
      setMonthCursor(nextMonth);
      setSelectedDateKey(getDateKey(nextMonth));
    },
    [monthCursor]
  );

  const goToToday = useCallback(() => {
    const nextToday = new Date();
    setSelectedDateKey(getDateKey(nextToday));
    setMonthCursor(startOfMonth(nextToday));
  }, []);

  const selectDate = useCallback((date: Date) => {
    setSelectedDateKey(getDateKey(date));
    setMonthCursor(startOfMonth(date));
  }, []);

  if (loading) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <Text style={styles.loadingText}>Cargando calendario...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.pageTitle}>Calendario</Text>
              <Text style={styles.pageSubtitle}>
                Toca un dia, escribe por hora y crea recordatorios que se adapten a tu rutina.
              </Text>
            </View>

            <Pressable style={styles.todayButton} onPress={goToToday}>
              <Text style={styles.todayButtonText}>Hoy</Text>
            </Pressable>
          </View>

          <View style={styles.monthHeader}>
            <Pressable style={styles.monthNavButton} onPress={() => goToMonth(-1)}>
              <Ionicons name="chevron-back" size={20} color={colors.text} />
            </Pressable>

            <Text style={styles.monthLabel}>{monthLabel}</Text>

            <Pressable style={styles.monthNavButton} onPress={() => goToMonth(1)}>
              <Ionicons name="chevron-forward" size={20} color={colors.text} />
            </Pressable>
          </View>

          <View style={styles.weekRow}>
            {['Lun', 'Mar', 'MiÃ©', 'Jue', 'Vie', 'SÃ¡b', 'Dom'].map((day) => (
              <Text key={day} style={styles.weekLabel}>
                {day}
              </Text>
            ))}
          </View>

          <View style={styles.grid}>
            {monthGrid.map((cell) => {
              const dayEntries = entriesByDate.get(cell.dateKey) ?? [];
              const isSelected = cell.dateKey === selectedDateKey;
              const isToday = cell.dateKey === todayKey;

              return (
                <Pressable
                  key={cell.dateKey}
                  style={[
                    styles.dayCell,
                    !cell.inCurrentMonth && styles.dayCellMuted,
                    isSelected && styles.dayCellSelected,
                    isToday && !isSelected && styles.dayCellToday,
                  ]}
                  onPress={() => selectDate(cell.date)}
                >
                  <Text
                    style={[
                      styles.dayCellText,
                      !cell.inCurrentMonth && styles.dayCellTextMuted,
                      isSelected && styles.dayCellTextSelected,
                    ]}
                  >
                    {cell.date.getDate()}
                  </Text>

                  {dayEntries.length > 0 ? (
                    <View style={styles.dayDotRow}>
                      {dayEntries.slice(0, 3).map((entry) => (
                        <View key={entry.id} style={styles.dayDot} />
                      ))}
                      {dayEntries.length > 3 ? (
                        <Text style={styles.dayCountText}>+{dayEntries.length - 3}</Text>
                      ) : null}
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.scheduleCard}>
          <View style={styles.scheduleHeader}>
            <View>
              <Text style={styles.sectionTitle}>{selectedDateLabel}</Text>
              <Text style={styles.sectionSubtitle}>
                {hasEntries
                  ? `${selectedDayEntries.length} bloque${selectedDayEntries.length === 1 ? '' : 's'} guardado${selectedDayEntries.length === 1 ? '' : 's'}`
                  : 'Todavia no hay nada guardado para este dia.'}
              </Text>
            </View>
          </View>

          <View style={styles.hourList}>
            {Array.from({ length: 24 }, (_, hour) => {
              const entry = selectedDayEntries.find((item) => item.hour === hour) ?? null;

              return (
                <Pressable
                  key={`${selectedDateKey}-${hour}`}
                  style={[styles.hourRow, entry ? styles.hourRowFilled : null]}
                  onPress={() => openHourEditor(hour)}
                >
                  <View style={styles.hourColumn}>
                    <Text style={styles.hourLabel}>{formatCalendarHour(hour)}</Text>
                    <Text style={styles.hourRange}>
                      {`${formatCalendarHour(hour)} - ${formatCalendarHour((hour + 1) % 24)}`}
                    </Text>
                  </View>

                  <View style={styles.hourContent}>
                    <Text
                      style={[styles.hourText, !entry ? styles.hourPlaceholder : null]}
                      numberOfLines={2}
                    >
                      {entry ? entry.text : t('calendar.hourPlaceholder')}
                    </Text>

                    {entry && entry.reminderMinutesBefore !== null ? (
                      <Text style={styles.reminderChip}>
                        {formatReminderLabel(entry.reminderMinutesBefore)}
                      </Text>
                    ) : null}
                  </View>

                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <Modal visible={editorVisible} transparent animationType="fade" onRequestClose={() => setEditorVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {selectedHour === null ? 'Hora' : formatCalendarHour(selectedHour)}
            </Text>
            <Text style={styles.modalSubtitle}>
              Escribe lo que quieres hacer en esta hora.
            </Text>

            <TextInput
              value={draftText}
              onChangeText={setDraftText}
              placeholder="Ej: estudiar historia, repasar formulas..."
              placeholderTextColor={colors.textMuted}
              multiline
              style={styles.modalInput}
              textAlignVertical="top"
            />

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, styles.secondaryModalButton]}
                onPress={() => setEditorVisible(false)}
              >
                <Text style={styles.modalButtonSecondaryText}>Cancelar</Text>
              </Pressable>

              <Pressable
                style={[styles.modalButton, styles.primaryModalButton, saving && styles.buttonDisabled]}
                onPress={() => {
                  void handleSaveEntry();
                }}
                disabled={saving}
              >
                <Text style={styles.primaryModalButtonText}>{saving ? 'Guardando...' : 'Aceptar'}</Text>
              </Pressable>
            </View>

            {editingEntry ? (
              <Pressable style={[styles.modalDeleteButton, styles.dangerButton]} onPress={handleDeleteEntry}>
                <Text style={styles.modalButtonText}>Eliminar texto</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </Modal>

      <Modal visible={reminderVisible} transparent animationType="fade" onRequestClose={() => setReminderVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Recordatorio</Text>
            <Text style={styles.modalSubtitle}>
              Elige cuando quieres que aparezca la notificacion.
            </Text>

            <View style={styles.reminderOptions}>
              {REMINDER_OPTIONS.map((option) => {
                const active = selectedReminderMinutes === option.minutesBefore;

                return (
                  <Pressable
                    key={option.label}
                    style={[styles.reminderOption, active && styles.reminderOptionActive]}
                    onPress={() => setSelectedReminderMinutes(option.minutesBefore ?? 60)}
                  >
                    <Text style={[styles.reminderOptionText, active && styles.reminderOptionTextActive]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}

              <Pressable
                style={[
                  styles.reminderOption,
                  selectedReminderMinutes === 'custom' && styles.reminderOptionActive,
                ]}
                onPress={() => setSelectedReminderMinutes('custom')}
              >
                <Text
                  style={[
                    styles.reminderOptionText,
                    selectedReminderMinutes === 'custom' && styles.reminderOptionTextActive,
                  ]}
                >
                  Personalizado
                </Text>
              </Pressable>
            </View>

            {selectedReminderMinutes === 'custom' ? (
              <TextInput
                value={customReminderMinutes}
                onChangeText={setCustomReminderMinutes}
                placeholder="Minutos antes"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                style={styles.customReminderInput}
              />
            ) : null}

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, styles.secondaryModalButton]}
                onPress={() => {
                  setReminderVisible(false);
                  setPendingReminderEntry(null);
                }}
              >
                <Text style={styles.modalButtonSecondaryText}>Cancelar</Text>
              </Pressable>

              <Pressable
                style={[styles.modalButton, styles.primaryModalButton, saving && styles.buttonDisabled]}
                onPress={() => {
                  void handleConfirmReminder();
                }}
                disabled={saving}
              >
                <Text style={styles.primaryModalButtonText}>
                  {saving ? 'Guardando...' : 'Crear recordatorio'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function createStyles(colors: AppColors) {
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
    paddingHorizontal: 18,
    paddingTop: 74,
    paddingBottom: 96,
    gap: 16,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 16,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.creamSoft,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  pageTitle: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '800',
  },
  pageSubtitle: {
    color: colors.textMuted,
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 260,
  },
  todayButton: {
    backgroundColor: colors.cream,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  todayButtonText: {
    color: colors.accentText,
    fontWeight: '700',
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  monthNavButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundMuted,
  },
  monthLabel: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  weekLabel: {
    flex: 1,
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.2857%',
    minHeight: 52,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  dayCellMuted: {
    opacity: 0.46,
  },
  dayCellToday: {
    backgroundColor: colors.backgroundMuted,
  },
  dayCellSelected: {
    backgroundColor: colors.cream,
  },
  dayCellText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  dayCellTextMuted: {
    color: colors.textMuted,
  },
  dayCellTextSelected: {
    color: colors.accentText,
  },
  dayDotRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  dayDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.text,
    opacity: 0.75,
  },
  dayCountText: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  scheduleCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.creamSoft,
  },
  scheduleHeader: {
    marginBottom: 14,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
  },
  sectionSubtitle: {
    color: colors.textMuted,
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
  },
  hourList: {
    gap: 10,
  },
  hourRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.creamSoft,
  },
  hourRowFilled: {
    borderColor: colors.shadow,
  },
  hourColumn: {
    width: 76,
  },
  hourLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  hourRange: {
    color: colors.textMuted,
    marginTop: 4,
    fontSize: 11,
  },
  hourContent: {
    flex: 1,
    gap: 8,
  },
  hourText: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
  },
  hourPlaceholder: {
    color: colors.textMuted,
    fontWeight: '500',
  },
  reminderChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.backgroundMuted,
    color: colors.text,
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(18, 20, 34, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: colors.background,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.creamSoft,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  modalSubtitle: {
    color: colors.textMuted,
    marginTop: 8,
    marginBottom: 14,
    fontSize: 14,
    lineHeight: 20,
  },
  modalInput: {
    minHeight: 140,
    borderRadius: 18,
    backgroundColor: colors.backgroundMuted,
    borderWidth: 1,
    borderColor: colors.creamSoft,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: colors.text,
    fontSize: 15,
    lineHeight: 21,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  primaryModalButton: {
    backgroundColor: colors.cream,
  },
  primaryModalButtonText: {
    color: colors.accentText,
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryModalButton: {
    backgroundColor: colors.surfaceAlt,
  },
  modalButtonSecondaryText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  modalButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  dangerButton: {
    backgroundColor: '#7f1d1d',
  },
  modalDeleteButton: {
    marginTop: 10,
    minHeight: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  reminderOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  reminderOption: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.creamSoft,
  },
  reminderOptionActive: {
    backgroundColor: colors.cream,
    borderColor: colors.shadow,
  },
  reminderOptionText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  reminderOptionTextActive: {
    color: colors.accentText,
  },
  customReminderInput: {
    marginTop: 14,
    borderRadius: 16,
    backgroundColor: colors.backgroundMuted,
    borderWidth: 1,
    borderColor: colors.creamSoft,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 15,
  },
});
}

