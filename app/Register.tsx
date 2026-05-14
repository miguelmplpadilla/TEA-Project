import { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { getAuthErrorMessage, registerWithEmail } from '@/services/auth';
import { hasFirebaseConfig, missingFirebaseConfigKeys } from '@/services/firebase';

export type RegisterHandle = {
  submit: () => void;
};

type RegisterState = {
  canSubmit: boolean;
  isSubmitting: boolean;
};

type RegisterProps = {
  showSubmitButton?: boolean;
  onStateChange?: (state: RegisterState) => void;
};

function Register(
  { showSubmitButton = true, onStateChange}: RegisterProps,
  ref: React.Ref<RegisterHandle>,
) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit =
      hasFirebaseConfig &&
      email.trim().length > 0 &&
      password.length >= 6 &&
      confirmPassword.length >= 6 &&
      !isSubmitting;

  const handleRegister = useCallback(async () => {
    if (!canSubmit) {
      return;
    }

    setError('');
    setSuccessMessage('');

    if (password !== confirmPassword) {
      setError('Las contrasenas no coinciden.');
      return;
    }

    setIsSubmitting(true);

    try {
      const user = await registerWithEmail({
        email,
        password,
      });

      setSuccessMessage(`Cuenta creada para ${user.email}. UID: ${user.uid}`);
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (registerError) {
      setError(getAuthErrorMessage(registerError));
    } finally {
      setIsSubmitting(false);
    }
  }, [canSubmit, confirmPassword, email, password]);

  useImperativeHandle(ref, () => ({
    submit: handleRegister,
  }), [handleRegister]);

  useEffect(() => {
    onStateChange?.({ canSubmit, isSubmitting });
  }, [canSubmit, isSubmitting, onStateChange]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={styles.eyebrow}>TEARS</Text>
            <Text style={styles.title}>Crear cuenta</Text>
            <Text style={styles.subtitle}>
              Demo de registro con Firebase Authentication usando email y contrasena.
            </Text>
          </View>

          {!hasFirebaseConfig && (
            <View style={styles.warningBox}>
              <Text style={styles.warningTitle}>Configura Firebase para probar el registro</Text>
              <Text style={styles.warningText}>
                Faltan estas variables en `.env`: {missingFirebaseConfigKeys.join(', ')}.
              </Text>
            </View>
          )}

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                placeholder="correo@ejemplo.com"
                style={styles.input}
                textContentType="emailAddress"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Contrasena</Text>
              <TextInput
                placeholder="Minimo 6 caracteres"
                secureTextEntry
                style={styles.input}
                textContentType="newPassword"
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Repetir contrasena</Text>
              <TextInput
                placeholder="Repite la contrasena"
                secureTextEntry
                style={styles.input}
                textContentType="newPassword"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

            {showSubmitButton && (
              <TouchableOpacity
                activeOpacity={0.82}
                disabled={!canSubmit}
                style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
                onPress={handleRegister}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.submitButtonText}>Registrarme</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default forwardRef(Register);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f6f3',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 36,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  header: {
    marginTop: 15,
    marginBottom: 24,
  },
  eyebrow: {
    color: '#526057',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0,
    marginBottom: 8,
  },
  title: {
    color: '#111814',
    fontSize: 30,
    fontWeight: '700',
    lineHeight: 36,
  },
  subtitle: {
    color: '#526057',
    fontSize: 16,
    lineHeight: 23,
    marginTop: 8,
  },
  warningBox: {
    backgroundColor: '#fff7df',
    borderColor: '#e8cf82',
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    padding: 14,
  },
  warningTitle: {
    color: '#5c4311',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 6,
  },
  warningText: {
    color: '#725b20',
    fontSize: 13,
    lineHeight: 19,
  },
  form: {
    backgroundColor: '#ffffff',
    borderColor: '#dce3dd',
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
  },
  field: {
    marginBottom: 14,
  },
  label: {
    color: '#20352b',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 7,
  },
  input: {
    backgroundColor: '#f8faf8',
    borderColor: '#d7e0d9',
    borderRadius: 8,
    borderWidth: 1,
    color: '#111814',
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: 12,
  },
  errorText: {
    color: '#a33b30',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  successText: {
    color: '#1e6a45',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: '#20352b',
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 50,
  },
  submitButtonDisabled: {
    opacity: 0.45,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
});
