import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { loginWithEmail, registerWithEmail } from '../../services/authApi';
import { getAuthState, login, logout } from '../../services/authStorage';
import { pullHistoryFromCloud, pushHistoryToCloud } from '../../services/historySyncService';
import { getHistoryItems, mergeHistoryItems, setHistoryItems } from '../../services/historyStorage';

export default function AccountScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const loadAccount = useCallback(async () => {
    const auth = await getAuthState();
    setAuthEmail(auth.email);

    if (auth.email) {
      setEmail(auth.email);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadAccount();
    }, [loadAccount])
  );

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Faltan datos', 'Completa email y password para iniciar sesion.');
      return;
    }

    try {
      setIsBusy(true);
      const token = await loginWithEmail(email.trim(), password);
      await login(token, email.trim());
      setPassword('');
      await loadAccount();
      router.replace('/(tabs)');
      Alert.alert('Sesion iniciada', 'Tu cuenta quedo conectada correctamente.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo iniciar sesion.';
      Alert.alert('Error de acceso', message);
    } finally {
      setIsBusy(false);
    }
  };

  const handleRegister = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Faltan datos', 'Completa email y password para crear la cuenta.');
      return;
    }

    if (password.trim().length < 6) {
      Alert.alert('Password muy corto', 'Usa al menos 6 caracteres.');
      return;
    }

    try {
      setIsBusy(true);
      const token = await registerWithEmail(email.trim(), password);
      await login(token, email.trim());
      setPassword('');
      await loadAccount();
      router.replace('/(tabs)');
      Alert.alert('Cuenta creada', 'Tu cuenta quedo creada e iniciada correctamente.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo crear la cuenta.';
      Alert.alert('Error de registro', message);
    } finally {
      setIsBusy(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setAuthEmail(null);
    setPassword('');
    router.replace('/login');
    Alert.alert('Sesion cerrada', 'La cuenta se desconecto de este dispositivo.');
  };

  const handlePush = async () => {
    try {
      setIsBusy(true);
      const total = await pushHistoryToCloud();
      Alert.alert('Sincronizacion completa', `Se subieron ${total} elementos a la nube.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo subir el historial.';
      Alert.alert('Error sincronizando', message);
    } finally {
      setIsBusy(false);
    }
  };

  const handlePull = async () => {
    try {
      setIsBusy(true);
      const remoteItems = await pullHistoryFromCloud();
      const localItems = await getHistoryItems();
      const merged = mergeHistoryItems(localItems, remoteItems);
      await setHistoryItems(merged);
      Alert.alert(
        'Historial actualizado',
        `Se integraron ${remoteItems.length} elementos remotos sin perder tu contenido local.`
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No se pudo descargar el historial.';
      Alert.alert('Error sincronizando', message);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Cuenta</Text>
      <Text style={styles.subtitle}>Accede a tu cuenta y sincroniza el historial en la nube.</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Estado de sesion</Text>
        <Text style={styles.cardText}>
          {authEmail
            ? `Sesion iniciada como ${authEmail}.`
            : 'Todavia no hay una sesion activa en este dispositivo.'}
        </Text>

        {!authEmail ? (
          <>
            <View style={styles.authModeRow}>
              <Pressable
                style={[styles.authModeButton, authMode === 'login' && styles.authModeButtonActive]}
                onPress={() => setAuthMode('login')}
              >
                <Text style={styles.authModeText}>Entrar</Text>
              </Pressable>
              <Pressable
                style={[styles.authModeButton, authMode === 'register' && styles.authModeButtonActive]}
                onPress={() => setAuthMode('register')}
              >
                <Text style={styles.authModeText}>Crear cuenta</Text>
              </Pressable>
            </View>

            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="tu@email.com"
              placeholderTextColor="#64748b"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor="#64748b"
              secureTextEntry
              style={styles.input}
            />

            <Pressable
              style={styles.primaryButton}
              onPress={authMode === 'login' ? handleLogin : handleRegister}
              disabled={isBusy}
            >
              <Text style={styles.primaryButtonText}>
                {isBusy
                  ? authMode === 'login'
                    ? 'Conectando...'
                    : 'Creando cuenta...'
                  : authMode === 'login'
                  ? 'Iniciar sesion'
                  : 'Crear cuenta'}
              </Text>
            </Pressable>
          </>
        ) : (
          <View style={styles.buttonColumn}>
            <Pressable style={styles.primaryButton} onPress={handlePush} disabled={isBusy}>
              <Text style={styles.primaryButtonText}>
                {isBusy ? 'Sincronizando...' : 'Subir historial'}
              </Text>
            </Pressable>

            <Pressable style={styles.secondaryButton} onPress={handlePull} disabled={isBusy}>
              <Text style={styles.secondaryButtonText}>Traer historial</Text>
            </Pressable>

            <Pressable style={styles.ghostButton} onPress={handleLogout} disabled={isBusy}>
              <Text style={styles.ghostButtonText}>Cerrar sesion</Text>
            </Pressable>
          </View>
        )}

        <Pressable style={styles.planButton} onPress={() => router.push('/pricing')}>
          <Text style={styles.planButtonText}>Ver planes y Premium</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 120,
  },
  title: {
    color: 'white',
    fontSize: 34,
    fontWeight: '800',
    marginBottom: 10,
  },
  subtitle: {
    color: '#cbd5e1',
    fontSize: 17,
    lineHeight: 24,
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#111827',
    borderRadius: 18,
    padding: 18,
  },
  cardTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  cardText: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 14,
  },
  authModeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  authModeButton: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  authModeButtonActive: {
    backgroundColor: '#2563eb',
  },
  authModeText: {
    color: 'white',
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: 'white',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  buttonColumn: {
    gap: 10,
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: 'white',
    fontWeight: '700',
  },
  ghostButton: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  ghostButtonText: {
    color: '#cbd5e1',
    fontWeight: '700',
  },
  planButton: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  planButtonText: {
    color: '#cbd5e1',
    fontWeight: '700',
  },
});
