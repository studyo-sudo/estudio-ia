import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

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
            placeholderTextColor="#64748b"
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
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 18,
  },
  title: {
    color: 'white',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 14,
  },
  input: {
    backgroundColor: '#1e293b',
    color: 'white',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
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
    backgroundColor: '#1e293b',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#cbd5e1',
    fontSize: 15,
    fontWeight: '700',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '800',
  },
});
