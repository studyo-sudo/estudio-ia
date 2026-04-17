import Constants from 'expo-constants';
import { router, useFocusEffect } from 'expo-router';
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
import { useAppPreferences } from '../../contexts/AppPreferencesContext';
import { APP_LANGUAGE_OPTIONS, getLanguageLabel } from '../../services/appI18n';
import { loginWithEmail, registerWithEmail } from '../../services/authApi';
import { resolvePostAuthRoute } from '../../services/authRouting';
import { getAuthState, login, logout } from '../../services/authStorage';
import { pullHistoryFromCloud, pushHistoryToCloud } from '../../services/historySyncService';
import { getHistoryItems, mergeHistoryItems, setHistoryItems } from '../../services/historyStorage';

export default function AccountScreen() {
  const appVersion = Constants.expoConfig?.version || 'desconocida';
  const { colors, t, language, setLanguage, themeMode, setThemeMode } = useAppPreferences();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [languageMenuVisible, setLanguageMenuVisible] = useState(false);

  const styles = useMemo(() => createStyles(colors), [colors]);
  const currentLanguage =
    APP_LANGUAGE_OPTIONS.find((option) => option.code === language) ?? APP_LANGUAGE_OPTIONS[0];

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
      Alert.alert('Faltan datos', t('login.missingData'));
      return;
    }

    try {
      setIsBusy(true);
      const session = await loginWithEmail(email.trim(), password);
      await login(session.token, email.trim(), {
        phoneVerified: session.phoneVerified,
        phoneNumber: session.phoneNumber,
      });
      setPassword('');
      await loadAccount();
      router.replace(await resolvePostAuthRoute());
      Alert.alert('Sesión iniciada', 'Tu cuenta quedó conectada correctamente.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo iniciar sesión.';
      Alert.alert('Error de acceso', message);
    } finally {
      setIsBusy(false);
    }
  };

  const handleRegister = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Faltan datos', t('login.missingData'));
      return;
    }

    if (password.trim().length < 6) {
      Alert.alert('Contraseña muy corta', t('login.shortPassword'));
      return;
    }

    try {
      setIsBusy(true);
      const session = await registerWithEmail(email.trim(), password);
      await login(session.token, email.trim(), {
        phoneVerified: session.phoneVerified,
        phoneNumber: session.phoneNumber,
      });
      setPassword('');
      await loadAccount();
      router.replace(await resolvePostAuthRoute());
      Alert.alert('Cuenta creada', 'Tu cuenta quedó creada e iniciada correctamente.');
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
    Alert.alert('Sesión cerrada', 'La cuenta se desconectó de este dispositivo.');
  };

  const handlePush = async () => {
    try {
      setIsBusy(true);
      const total = await pushHistoryToCloud();
      Alert.alert('Sincronización completa', `Se subieron ${total} elementos a la nube.`);
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
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{t('account.title')}</Text>
          <Text style={styles.subtitle}>
            {t('account.subtitle', { version: appVersion })}
          </Text>
        </View>

        <Pressable
          style={styles.languageButton}
          onPress={() => setLanguageMenuVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={`${t('account.languageButton')}: ${getLanguageLabel(language)}`}
        >
          <Text style={styles.languageButtonFlag}>{currentLanguage.flag}</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('account.statusTitle')}</Text>
        <Text style={styles.cardText}>
          {authEmail ? t('account.loggedInAs', { email: authEmail }) : t('account.notLoggedIn')}
        </Text>

        {!authEmail ? (
          <>
            <View style={styles.authModeRow}>
              <Pressable
                style={[styles.authModeButton, authMode === 'login' && styles.authModeButtonActive]}
                onPress={() => setAuthMode('login')}
              >
                <Text
                  style={[
                    styles.authModeText,
                    authMode === 'login' && styles.authModeTextActive,
                  ]}
                >
                  {t('account.loginTab')}
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.authModeButton,
                  authMode === 'register' && styles.authModeButtonActive,
                ]}
                onPress={() => setAuthMode('register')}
              >
                <Text
                  style={[
                    styles.authModeText,
                    authMode === 'register' && styles.authModeTextActive,
                  ]}
                >
                  {t('account.registerTab')}
                </Text>
              </Pressable>
            </View>

            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder={t('account.emailPlaceholder')}
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder={t('account.passwordPlaceholder')}
              placeholderTextColor={colors.textMuted}
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
                    ? t('account.loadingLogin')
                    : t('account.loadingRegister')
                  : authMode === 'login'
                  ? t('account.submitLogin')
                  : t('account.submitRegister')}
              </Text>
            </Pressable>
          </>
        ) : (
          <View style={styles.buttonColumn}>
            <Pressable style={styles.primaryButton} onPress={handlePush} disabled={isBusy}>
              <Text style={styles.primaryButtonText}>
                {isBusy ? t('account.syncing') : t('account.syncUp')}
              </Text>
            </Pressable>

            <Pressable style={styles.secondaryButton} onPress={handlePull} disabled={isBusy}>
              <Text style={styles.secondaryButtonText}>{t('account.syncDown')}</Text>
            </Pressable>

            <Pressable style={styles.ghostButton} onPress={handleLogout} disabled={isBusy}>
              <Text style={styles.ghostButtonText}>{t('account.logout')}</Text>
            </Pressable>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('account.themeTitle')}</Text>
        <View style={styles.themeRow}>
          <Pressable
            style={[styles.themeButton, themeMode === 'dark' && styles.themeButtonActive]}
            onPress={() => {
              void setThemeMode('dark');
            }}
          >
            <Text style={[styles.themeButtonText, themeMode === 'dark' && styles.themeButtonTextActive]}>
              {t('account.themeDark')}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.themeButton, themeMode === 'light' && styles.themeButtonActive]}
            onPress={() => {
              void setThemeMode('light');
            }}
          >
            <Text
              style={[
                styles.themeButtonText,
                themeMode === 'light' && styles.themeButtonTextActive,
              ]}
            >
              {t('account.themeLight')}
            </Text>
          </Pressable>
        </View>
      </View>

      <Modal visible={languageMenuVisible} transparent animationType="fade" onRequestClose={() => setLanguageMenuVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('account.languageTitle')}</Text>
            <Text style={styles.modalSubtitle}>{t('account.languageSubtitle')}</Text>

            <View style={styles.languageOptions}>
              {APP_LANGUAGE_OPTIONS.map((option) => {
                const active = language === option.code;

                return (
                  <Pressable
                    key={option.code}
                    style={[styles.languageOption, active && styles.languageOptionActive]}
                    onPress={() => {
                      void setLanguage(option.code);
                      setLanguageMenuVisible(false);
                    }}
                  >
                    <View style={styles.languageOptionRow}>
                      <Text style={styles.languageOptionFlag}>{option.flag}</Text>
                      <Text
                        style={[
                          styles.languageOptionText,
                          active && styles.languageOptionTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <Pressable style={styles.closeButton} onPress={() => setLanguageMenuVisible(false)}>
              <Text style={styles.closeButtonText}>{t('common.close')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function createStyles(colors: ReturnType<typeof useAppPreferences>['colors']) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 72,
      paddingBottom: 88,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12,
      marginBottom: 24,
    },
    headerText: {
      flex: 1,
    },
    title: {
      color: colors.text,
      fontSize: 34,
      fontWeight: '800',
      marginBottom: 10,
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: 17,
      lineHeight: 24,
    },
    languageButton: {
      width: 54,
      height: 54,
      borderRadius: 27,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.creamSoft,
    },
    languageButtonFlag: {
      color: colors.text,
      fontSize: 24,
      fontWeight: '700',
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.creamSoft,
      marginBottom: 16,
    },
    cardTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '700',
      marginBottom: 8,
    },
    cardText: {
      color: colors.textMuted,
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
      backgroundColor: colors.surfaceAlt,
      borderRadius: 10,
      paddingVertical: 10,
      alignItems: 'center',
    },
    authModeButtonActive: {
      backgroundColor: colors.cream,
    },
    authModeText: {
      color: colors.text,
      fontWeight: '700',
    },
    authModeTextActive: {
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
    buttonColumn: {
      gap: 10,
    },
    primaryButton: {
      backgroundColor: colors.cream,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: 'center',
    },
    primaryButtonText: {
      color: colors.accentText,
      fontWeight: '700',
    },
    secondaryButton: {
      backgroundColor: colors.surfaceAlt,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: 'center',
    },
    secondaryButtonText: {
      color: colors.text,
      fontWeight: '700',
    },
    ghostButton: {
      backgroundColor: colors.surfaceDeep,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: 'center',
    },
    ghostButtonText: {
      color: colors.textMuted,
      fontWeight: '700',
    },
    themeRow: {
      flexDirection: 'row',
      gap: 10,
    },
    themeButton: {
      flex: 1,
      backgroundColor: colors.background,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.creamSoft,
    },
    themeButtonActive: {
      backgroundColor: colors.cream,
    },
    themeButtonText: {
      color: colors.text,
      fontWeight: '700',
    },
    themeButtonTextActive: {
      color: colors.accentText,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    },
    modalCard: {
      width: '100%',
      maxWidth: 420,
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.creamSoft,
    },
    modalTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '800',
      marginBottom: 8,
    },
    modalSubtitle: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 21,
      marginBottom: 14,
    },
    languageOptions: {
      gap: 10,
    },
    languageOption: {
      backgroundColor: colors.background,
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor: colors.creamSoft,
    },
    languageOptionActive: {
      backgroundColor: colors.cream,
    },
    languageOptionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    languageOptionFlag: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '700',
      minWidth: 22,
    },
    languageOptionText: {
      color: colors.text,
      fontWeight: '700',
      fontSize: 15,
    },
    languageOptionTextActive: {
      color: colors.accentText,
    },
    closeButton: {
      backgroundColor: colors.surfaceAlt,
      borderRadius: 14,
      paddingVertical: 12,
      alignItems: 'center',
      marginTop: 14,
    },
    closeButtonText: {
      color: colors.text,
      fontWeight: '700',
    },
  });
}
