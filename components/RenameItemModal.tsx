import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAppPreferences } from '../contexts/AppPreferencesContext';

type Props = {
  visible: boolean;
  title: string;
  initialValue: string;
  saving?: boolean;
  onClose: () => void;
  onSave: (value: string) => void;
};

export default function RenameItemModal({
  visible,
  title,
  initialValue,
  saving = false,
  onClose,
  onSave,
}: Props) {
  const { colors, t } = useAppPreferences();
  const [value, setValue] = useState(initialValue);
  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    if (visible) {
      setValue(initialValue);
    }
  }, [initialValue, visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>
            Escribe un nombre más claro para tener tu historial mejor organizado.
          </Text>

          <TextInput
            value={value}
            onChangeText={setValue}
            placeholder="Nuevo nombre"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            autoFocus
            returnKeyType="done"
          />

          <View style={styles.row}>
            <Pressable style={styles.secondaryButton} onPress={onClose} disabled={saving}>
              <Text style={styles.secondaryButtonText}>{t('common.cancel')}</Text>
            </Pressable>

            <Pressable
              style={[styles.primaryButton, saving && styles.primaryButtonDisabled]}
              onPress={() => onSave(value)}
              disabled={saving}
            >
              <Text style={styles.primaryButtonText}>
                {saving ? t('common.saving') : t('common.save')}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(colors: ReturnType<typeof useAppPreferences>['colors']) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: colors.overlay,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    },
    card: {
      width: '100%',
      maxWidth: 420,
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.creamSoft,
    },
    title: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '800',
      marginBottom: 8,
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 21,
      marginBottom: 14,
    },
    input: {
      backgroundColor: colors.background,
      color: colors.text,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.creamSoft,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
    },
    row: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 16,
    },
    secondaryButton: {
      flex: 1,
      backgroundColor: colors.background,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.creamSoft,
    },
    secondaryButtonText: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '700',
    },
    primaryButton: {
      flex: 1,
      backgroundColor: colors.cream,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
    },
    primaryButtonDisabled: {
      opacity: 0.7,
    },
    primaryButtonText: {
      color: colors.accentText,
      fontSize: 15,
      fontWeight: '800',
    },
  });
}
