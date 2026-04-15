import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { APP_COLORS } from '../constants/theme';

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
  const [value, setValue] = useState(initialValue);

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
            Escribe un nombre mas claro para tener tu historial mejor organizado.
          </Text>

          <TextInput
            value={value}
            onChangeText={setValue}
            placeholder="Nuevo nombre"
            placeholderTextColor={APP_COLORS.textMuted}
            style={styles.input}
            autoFocus
            returnKeyType="done"
          />

          <View style={styles.row}>
            <Pressable style={styles.secondaryButton} onPress={onClose} disabled={saving}>
              <Text style={styles.secondaryButtonText}>Cancelar</Text>
            </Pressable>

            <Pressable
              style={[styles.primaryButton, saving && styles.primaryButtonDisabled]}
              onPress={() => onSave(value)}
              disabled={saving}
            >
              <Text style={styles.primaryButtonText}>
                {saving ? 'Guardando...' : 'Guardar'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: APP_COLORS.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: APP_COLORS.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: APP_COLORS.creamSoft,
  },
  title: {
    color: APP_COLORS.text,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    color: APP_COLORS.textMuted,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 14,
  },
  input: {
    backgroundColor: APP_COLORS.background,
    color: APP_COLORS.text,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: APP_COLORS.creamSoft,
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
    backgroundColor: APP_COLORS.background,
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
  },
  primaryButton: {
    flex: 1,
    backgroundColor: APP_COLORS.text,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: APP_COLORS.accentText,
    fontSize: 15,
    fontWeight: '800',
  },
});
