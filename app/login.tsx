import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
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
import { useAppPreferences } from '../contexts/AppPreferencesContext';
import { loginWithEmail, registerWithEmail } from '../services/authApi';
import { resolvePostAuthRoute } from '../services/authRouting';
import { getAuthState, login } from '../services/authStorage';

export default function LoginScreen() {
  const appVersion = Constants.expoConfig?.version || 'desconocida';
  const { colors, t } = useAppPreferences();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    async function bootstrap() {
      const auth = await getAuthState();

      if (auth.token) {
        router.replace(await resolvePostAuthRoute());
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
      Alert.alert('Faltan datos', t('login.missingData'));
      return;
    }

    if (authMode === 'register' && password.trim().length < 6) {
      Alert.alert('Contraseña muy corta', t('login.shortPassword'));
      return;
    }

    try {
      setIsBusy(true);
      const normalizedEmail = email.trim();
      const session =
        authMode === 'login'
          ? await loginWithEmail(normalizedEmail, password)
          : await registerWithEmail(normalizedEmail, password);

      await login(session.token, normalizedEmail, {
        phoneVerified: session.phoneVerified,
        phoneNumber: session.phoneNumber,
      });
      router.replace(await resolvePostAuthRoute());
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : authMode === 'login'
          ? 'No se pudo iniciar sesión.'
          : 'No se pudo crear la cuenta.';

      Alert.alert(authMode === 'login' ? t('login.errorAccess') : t('login.errorRegister'), message);
    } finally {
      setIsBusy(false);
    }
  };

  if (isChecking) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.text} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.versionBadge}>{t('login.version', { version: appVersion })}</Text>

      <View style={styles.hero}>
        <Text style={styles.title}>{t('login.heroTitle')}</Text>
        <Text style={styles.subtitle}>{t('login.heroSubtitle')}</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.modeRow}>
          <Pressable
            style={[styles.modeButton, authMode === 'login' && styles.modeButtonActive]}
            onPress={() => setAuthMode('login')}
          >
            <Text
              style={[styles.modeButtonText, authMode === 'login' && styles.modeButtonTextActive]}
            >
              {t('login.loginTab')}
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
              {t('login.registerTab')}
            </Text>
          </Pressable>
        </View>

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder={t('login.emailPlaceholder')}
          placeholderTextColor={colors.textMuted}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />
        <View style={styles.passwordRow}>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder={t('login.passwordPlaceholder')}
            placeholderTextColor={colors.textMuted}
            secureTextEntry={!showPassword}
            style={styles.passwordInput}
          />
          <Pressable style={styles.eyeButton} onPress={() => setShowPassword((prev) => !prev)}>
            <Text style={styles.eyeButtonText}>
              {showPassword ? t('login.passwordHide') : t('login.passwordShow')}
            </Text>
          </Pressable>
        </View>

        <Pressable style={styles.primaryButton} onPress={handleSubmit} disabled={isBusy}>
          <Text style={styles.primaryButtonText}>
            {isBusy
              ? authMode === 'login'
                ? t('login.loadingLogin')
                : t('login.loadingRegister')
              : authMode === 'login'
              ? t('login.submitLogin')
              : t('login.submitRegister')}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: ReturnType<typeof useAppPreferences>['colors']) {
  return StyleSheet.create({
    loadingContainer: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: 20,
      justifyContent: 'center',
    },
    versionBadge: {
      position: 'absolute',
      top: 18,
      alignSelf: 'center',
      color: colors.textMuted,
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
      color: colors.text,
      fontSize: 38,
      fontWeight: '800',
      marginBottom: 10,
      textAlign: 'center',
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: 17,
      lineHeight: 24,
      textAlign: 'center',
      maxWidth: 320,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.creamSoft,
    },
    modeRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 12,
    },
    modeButton: {
      flex: 1,
      backgroundColor: colors.surfaceAlt,
      borderRadius: 10,
      paddingVertical: 10,
      alignItems: 'center',
    },
    modeButtonActive: {
      backgroundColor: colors.cream,
    },
    modeButtonText: {
      color: colors.text,
      fontWeight: '700',
    },
    modeButtonTextActive: {
      color: colors.accentText,
    },
    input: {
      backgroundColor: colors.background,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: colors.text,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.creamSoft,
    },
    passwordRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: 12,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.creamSoft,
      overflow: 'hidden',
    },
    passwordInput: {
      flex: 1,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: colors.text,
    },
    eyeButton: {
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    eyeButtonText: {
      color: colors.text,
      fontWeight: '700',
      fontSize: 13,
    },
    primaryButton: {
      backgroundColor: colors.cream,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 4,
    },
    primaryButtonText: {
      color: colors.accentText,
      fontWeight: '700',
      fontSize: 16,
    },
  });
}
