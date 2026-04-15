import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { loginWithEmail, registerWithEmail } from '../services/authApi';
import { getAuthState, login } from '../services/authStorage';
import { APP_COLORS } from '../constants/theme';

export default function LoginScreen() {
  const appVersion = Constants.expoConfig?.version || 'desconocida';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    async function bootstrap() {
      const auth = await getAuthState();

      if (auth.token) {
        router.replace('/(tabs)');
        return;
      }

      if (auth.email) {
        setEmail(auth.email);
      }

      setIsChecking(false);
    }

    void bootstrap();
  }, []);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Faltan datos', 'Completa email y password para continuar.');
      return;
    }

    if (authMode === 'register' && password.trim().length < 6) {
      Alert.alert('Password muy corto', 'Usa al menos 6 caracteres.');
      return;
    }

    try {
      setIsBusy(true);
      const normalizedEmail = email.trim();
      const token =
        authMode === 'login'
          ? await loginWithEmail(normalizedEmail, password)
          : await registerWithEmail(normalizedEmail, password);

      await login(token, normalizedEmail);
      router.replace('/(tabs)');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : authMode === 'login'
          ? 'No se pudo iniciar sesion.'
          : 'No se pudo crear la cuenta.';

      Alert.alert(authMode === 'login' ? 'Error de acceso' : 'Error de registro', message);
    } finally {
      setIsBusy(false);
    }
  };

  if (isChecking) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={APP_COLORS.text} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.versionBadge}>Version {appVersion}</Text>

      <View style={styles.hero}>
        <Text style={styles.title}>Studyo Ai</Text>
        <Text style={styles.subtitle}>
          Inicia sesion para entrar a la app y guardar tu historial en la nube.
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.modeRow}>
          <Pressable
            style={[styles.modeButton, authMode === 'login' && styles.modeButtonActive]}
            onPress={() => setAuthMode('login')}
          >
            <Text
              style={[
                styles.modeButtonText,
                authMode === 'login' && styles.modeButtonTextActive,
              ]}
            >
              Entrar
            </Text>
          </Pressable>
          <Pressable
            style={[styles.modeButton, authMode === 'register' && styles.modeButtonActive]}
            onPress={() => setAuthMode('register')}
          >
            <Text
              style={[
                styles.modeButtonText,
                authMode === 'register' && styles.modeButtonTextActive,
              ]}
            >
              Crear cuenta
            </Text>
          </Pressable>
        </View>

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="tu@email.com"
          placeholderTextColor={APP_COLORS.textMuted}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />
        <View style={styles.passwordRow}>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={APP_COLORS.textMuted}
            secureTextEntry={!showPassword}
            style={styles.passwordInput}
          />
          <Pressable style={styles.eyeButton} onPress={() => setShowPassword((prev) => !prev)}>
            <Text style={styles.eyeButtonText}>{showPassword ? 'Ocultar' : 'Ver'}</Text>
          </Pressable>
        </View>

        <Pressable style={styles.primaryButton} onPress={handleSubmit} disabled={isBusy}>
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  versionBadge: {
    position: 'absolute',
    top: 18,
    alignSelf: 'center',
    color: APP_COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  hero: {
    marginBottom: 28,
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  title: {
    color: APP_COLORS.text,
    fontSize: 38,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    color: APP_COLORS.textMuted,
    fontSize: 17,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 320,
  },
  card: {
    backgroundColor: APP_COLORS.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: APP_COLORS.creamSoft,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  modeButton: {
    flex: 1,
    backgroundColor: APP_COLORS.surfaceAlt,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: APP_COLORS.text,
  },
  modeButtonText: {
    color: APP_COLORS.text,
    fontWeight: '700',
  },
  modeButtonTextActive: {
    color: APP_COLORS.accentText,
  },
  input: {
    backgroundColor: APP_COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: APP_COLORS.text,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: APP_COLORS.creamSoft,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APP_COLORS.background,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: APP_COLORS.creamSoft,
    overflow: 'hidden',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: APP_COLORS.text,
  },
  eyeButton: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  eyeButtonText: {
    color: APP_COLORS.text,
    fontWeight: '700',
    fontSize: 13,
  },
  primaryButton: {
    backgroundColor: APP_COLORS.text,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryButtonText: {
    color: APP_COLORS.accentText,
    fontWeight: '700',
    fontSize: 16,
  },
});
