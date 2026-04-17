import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAppPreferences } from '../contexts/AppPreferencesContext';
import { verifyPhoneOnBackend } from '../services/authApi';
import { resolvePostAuthRoute } from '../services/authRouting';
import { getAuthState, updateAuthState } from '../services/authStorage';

function normalizePhoneInput(value: string) {
  return value.trim().replace(/\s+/g, '').replace(/[^\d+]/g, '');
}

function isValidPhoneNumber(value: string) {
  return value.startsWith('+') && value.length >= 8;
}

export default function PhoneVerificationScreen() {
  const { colors, t } = useAppPreferences();
  const [isChecking, setIsChecking] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [code, setCode] = useState('');
  const [confirmation, setConfirmation] =
    useState<FirebaseAuthTypes.ConfirmationResult | null>(null);

  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    let active = true;

    void (async () => {
      const route = await resolvePostAuthRoute();

      if (!active) {
        return;
      }

      if (route !== '/phone-verification') {
        router.replace(route);
        return;
      }

      const authState = await getAuthState();

      if (!active) {
        return;
      }

      if (authState.phoneNumber) {
        setPhoneNumber(authState.phoneNumber);
      }

      setIsChecking(false);
    })();

    return () => {
      active = false;
    };
  }, []);

  const sendCode = async (forceResend = false) => {
    const normalizedPhone = normalizePhoneInput(phoneNumber);

    if (!isValidPhoneNumber(normalizedPhone)) {
      Alert.alert(
        t('phoneVerification.invalidPhoneTitle'),
        t('phoneVerification.invalidPhoneText')
      );
      return;
    }

    try {
      setIsSending(true);
      const result = await auth().signInWithPhoneNumber(normalizedPhone, forceResend);
      setConfirmation(result);
      setCode('');
      Alert.alert(
        t('phoneVerification.codeSentTitle'),
        t('phoneVerification.codeSentText', { phone: normalizedPhone })
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t('phoneVerification.sendErrorFallback');
      Alert.alert(t('phoneVerification.sendErrorTitle'), message);
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!confirmation) {
      Alert.alert(
        t('phoneVerification.missingCodeTitle'),
        t('phoneVerification.missingCodeText')
      );
      return;
    }

    const normalizedCode = code.trim();

    if (!normalizedCode) {
      Alert.alert(
        t('phoneVerification.invalidCodeTitle'),
        t('phoneVerification.invalidCodeText')
      );
      return;
    }

    try {
      setIsVerifying(true);
      const credential = await confirmation.confirm(normalizedCode);
      const verifiedPhone =
        credential?.user?.phoneNumber || normalizePhoneInput(phoneNumber);
      const profile = await verifyPhoneOnBackend(verifiedPhone);

      await updateAuthState({
        email: profile.email,
        phoneVerified: profile.phoneVerified,
        phoneNumber: profile.phoneNumber || verifiedPhone,
      });

      Alert.alert(
        t('phoneVerification.verifiedTitle'),
        t('phoneVerification.verifiedText')
      );
      router.replace('/(tabs)');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t('phoneVerification.verifyErrorFallback');
      Alert.alert(t('phoneVerification.verifyErrorTitle'), message);
    } finally {
      setIsVerifying(false);
    }
  };

  if (isChecking) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.text} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.hero}>
            <Text style={styles.badge}>{t('phoneVerification.badge')}</Text>
            <Text style={styles.title}>{t('phoneVerification.title')}</Text>
            <Text style={styles.subtitle}>{t('phoneVerification.subtitle')}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('phoneVerification.phoneTitle')}</Text>
            <Text style={styles.helperText}>{t('phoneVerification.phoneHelp')}</Text>

            <TextInput
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder={t('phoneVerification.phonePlaceholder')}
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              autoCapitalize="none"
              style={styles.input}
            />

            {!confirmation ? (
              <Pressable
                style={styles.primaryButton}
                onPress={() => void sendCode(false)}
                disabled={isSending}
              >
                <Text style={styles.primaryButtonText}>
                  {isSending
                    ? t('phoneVerification.sending')
                    : t('phoneVerification.sendCode')}
                </Text>
              </Pressable>
            ) : (
              <>
                <Text style={styles.sectionTitle}>{t('phoneVerification.codeTitle')}</Text>
                <Text style={styles.helperText}>{t('phoneVerification.codeHelp')}</Text>

                <TextInput
                  value={code}
                  onChangeText={setCode}
                  placeholder={t('phoneVerification.codePlaceholder')}
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  style={styles.input}
                />

                <Pressable
                  style={styles.primaryButton}
                  onPress={() => void handleVerifyCode()}
                  disabled={isVerifying}
                >
                  <Text style={styles.primaryButtonText}>
                    {isVerifying
                      ? t('phoneVerification.verifying')
                      : t('phoneVerification.verifyCode')}
                  </Text>
                </Pressable>

                <View style={styles.secondaryRow}>
                  <Pressable
                    style={styles.secondaryButton}
                    onPress={() => void sendCode(true)}
                    disabled={isSending}
                  >
                    <Text style={styles.secondaryButtonText}>
                      {isSending
                        ? t('phoneVerification.sending')
                        : t('phoneVerification.resendCode')}
                    </Text>
                  </Pressable>

                  <Pressable
                    style={styles.secondaryButton}
                    onPress={() => {
                      setConfirmation(null);
                      setCode('');
                    }}
                  >
                    <Text style={styles.secondaryButtonText}>
                      {t('phoneVerification.changeNumber')}
                    </Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(colors: ReturnType<typeof useAppPreferences>['colors']) {
  return StyleSheet.create({
    flex: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    container: {
      flex: 1,
    },
    content: {
      flexGrow: 1,
      paddingHorizontal: 20,
      paddingTop: 36,
      paddingBottom: 28,
      justifyContent: 'center',
    },
    hero: {
      alignItems: 'center',
      marginBottom: 24,
    },
    badge: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 1.4,
      textTransform: 'uppercase',
      marginBottom: 10,
    },
    title: {
      color: colors.text,
      fontSize: 34,
      fontWeight: '800',
      textAlign: 'center',
      marginBottom: 10,
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: 16,
      lineHeight: 24,
      textAlign: 'center',
      maxWidth: 340,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.creamSoft,
      padding: 18,
      gap: 10,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '800',
    },
    helperText: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 21,
    },
    input: {
      backgroundColor: colors.background,
      borderColor: colors.creamSoft,
      borderRadius: 14,
      borderWidth: 1,
      color: colors.text,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
    },
    primaryButton: {
      backgroundColor: colors.cream,
      borderRadius: 14,
      alignItems: 'center',
      paddingVertical: 12,
      marginTop: 4,
    },
    primaryButtonText: {
      color: colors.accentText,
      fontSize: 16,
      fontWeight: '800',
    },
    secondaryRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 2,
    },
    secondaryButton: {
      flex: 1,
      backgroundColor: colors.surfaceAlt,
      borderRadius: 14,
      alignItems: 'center',
      paddingVertical: 12,
    },
    secondaryButtonText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '700',
      textAlign: 'center',
    },
  });
}
