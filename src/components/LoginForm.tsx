import {forwardRef, useCallback, useEffect, useImperativeHandle, useState} from 'react';
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

import {getAuthErrorMessage, loginWithEmail} from '@/services/auth';
import {hasFirebaseConfig, missingFirebaseConfigKeys} from '@/services/firebase';

export type LoginHandle = {
  submit: () => void;
};

type LoginState = {
  canSubmit: boolean;
  isSubmitting: boolean;
};

type LoginFormProps = {
  showSubmitButton?: boolean;
  onStateChange?: (state: LoginState) => void;
};

function LoginForm(
  {showSubmitButton = true, onStateChange}: LoginFormProps,
  ref: React.Ref<LoginHandle>,
) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit =
    hasFirebaseConfig &&
    email.trim().length > 0 &&
    password.length >= 6 &&
    !isSubmitting;

  const handleLogin = useCallback(async () => {
    if (!canSubmit) {
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await loginWithEmail({email, password});
    } catch (loginError) {
      setError(getAuthErrorMessage(loginError));
    } finally {
      setIsSubmitting(false);
    }
  }, [canSubmit, email, password]);

  useImperativeHandle(ref, () => ({
    submit: handleLogin,
  }), [handleLogin]);

  useEffect(() => {
    onStateChange?.({canSubmit, isSubmitting});
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
            <Text style={styles.title}>Iniciar sesion</Text>
            <Text style={styles.subtitle}>Entra con el email y la contrasena de tu cuenta.</Text>
          </View>

          {!hasFirebaseConfig && (
            <View style={styles.warningBox}>
              <Text style={styles.warningTitle}>Configura Firebase para probar el login</Text>
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
                placeholder="Tu contrasena"
                secureTextEntry
                style={styles.input}
                textContentType="password"
                value={password}
                onChangeText={setPassword}
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {showSubmitButton && (
              <TouchableOpacity
                activeOpacity={0.82}
                disabled={!canSubmit}
                style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
                onPress={handleLogin}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.submitButtonText}>Entrar</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default forwardRef(LoginForm);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f6f3',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    alignSelf: 'center',
    flexGrow: 1,
    maxWidth: 420,
    padding: 20,
    paddingBottom: 36,
    width: '100%',
  },
  header: {
    marginBottom: 24,
    marginTop: 15,
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
