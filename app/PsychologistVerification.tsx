import {FirebaseError} from 'firebase/app';
import {onAuthStateChanged} from 'firebase/auth';
import {router} from 'expo-router';
import {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';

import {FooterApp} from '@/components/Footer';
import {getFirebaseAuth} from '@/services/firebase';
import {
  getPsychologistVerificationRequest,
  getUserById,
  requestPsychologistVerification,
  type PsychologistVerificationRequest,
  type PsychologistVerificationStatus,
  type UserProfile,
} from '@/services/users';

function getStatusCopy(status: PsychologistVerificationStatus) {
  switch (status) {
    case 'pending':
      return {
        label: 'Pendiente',
        message: 'La solicitud esta guardada y aun no se mostrara en tu perfil.',
      };
    case 'verified':
      return {
        label: 'Verificada',
        message: 'Tu perfil ya puede mostrar que eres psicologa verificada.',
      };
    case 'rejected':
      return {
        label: 'Revisar',
        message: 'La solicitud anterior no se valido. Puedes enviar el numero corregido.',
      };
    default:
      return {
        label: 'Sin enviar',
        message: 'El distintivo del perfil se activara solo despues de comprobar la acreditacion.',
      };
  }
}

export default function PsychologistVerification() {
  const [uid, setUid] = useState('');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [request, setRequest] = useState<PsychologistVerificationRequest | null>(null);
  const [declaredPsychologist, setDeclaredPsychologist] = useState(false);
  const [collegiateNumber, setCollegiateNumber] = useState('');
  const [verificationDescription, setVerificationDescription] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadVerification = useCallback(async (userUid: string) => {
    setIsLoading(true);
    setError('');

    try {
      const [nextProfile, nextRequest] = await Promise.all([
        getUserById(userUid),
        getPsychologistVerificationRequest(userUid),
      ]);

      setProfile(nextProfile);
      setRequest(nextRequest);
      setDeclaredPsychologist(nextRequest?.declaredPsychologist ?? false);
      setCollegiateNumber(nextRequest?.collegiateNumber ?? '');
      setVerificationDescription(nextRequest?.verificationDescription ?? '');
    } catch (loadError) {
      if (loadError instanceof FirebaseError) {
        setError(`No se pudo cargar la acreditacion. Firebase: ${loadError.code}.`);
      } else {
        setError('No se pudo cargar la acreditacion.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    return onAuthStateChanged(getFirebaseAuth(), (authUser) => {
      if (!authUser) {
        setUid('');
        setProfile(null);
        setRequest(null);
        setIsLoading(false);
        return;
      }

      setUid(authUser.uid);
      void loadVerification(authUser.uid);
    });
  }, [loadVerification]);

  const status =
    profile?.psychologistVerificationStatus ??
    request?.status ??
    'not_requested';
  const statusCopy = getStatusCopy(status);
  const isVerified = status === 'verified';
  const canSubmit =
    !isLoading &&
    !isSubmitting &&
    !isVerified &&
    declaredPsychologist &&
    (collegiateNumber.trim().length > 0 || verificationDescription.trim().length > 0);

  async function handleSubmit() {
    if (!uid || !canSubmit) {
      return;
    }

    setIsSubmitting(true);
    setError('');
    setMessage('');

    try {
      await requestPsychologistVerification({
        uid,
        collegiateNumber,
        verificationDescription,
      });
      await loadVerification(uid);
      setMessage('Solicitud enviada para comprobacion.');
    } catch (submitError) {
      if (submitError instanceof FirebaseError) {
        setError(`No se pudo enviar la solicitud. Firebase: ${submitError.code}.`);
      } else {
        setError(
          submitError instanceof Error
            ? submitError.message
            : 'No se pudo enviar la solicitud.',
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity
            accessibilityLabel="Volver"
            activeOpacity={0.82}
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" style={styles.backIcon} />
          </TouchableOpacity>

          <Text style={styles.eyebrow}>Acreditacion</Text>
          <Text style={styles.title}>Psicologia</Text>
          <Text style={styles.subtitle}>
            Envia una referencia profesional para comprobarla antes de mostrarla en tu perfil.
          </Text>
        </View>

        <View style={styles.statusBox}>
          <View style={styles.statusHeading}>
            <Text style={styles.statusLabel}>Estado</Text>
            <View style={[styles.statusChip, styles[`${status}Chip`]]}>
              <Text style={styles.statusChipText}>{statusCopy.label}</Text>
            </View>
          </View>
          <Text style={styles.statusMessage}>{statusCopy.message}</Text>
        </View>

        <View style={styles.form}>
          <TouchableOpacity
            activeOpacity={0.82}
            disabled={isVerified}
            style={[styles.option, isVerified && styles.disabledOption]}
            onPress={() => setDeclaredPsychologist((currentValue) => !currentValue)}
          >
            <View style={[styles.checkbox, declaredPsychologist && styles.checkboxChecked]}>
              {declaredPsychologist ? <Ionicons name="checkmark" style={styles.checkboxIcon} /> : null}
            </View>
            <View style={styles.optionCopy}>
              <Text style={styles.optionTitle}>Soy psicologa colegiada</Text>
              <Text style={styles.optionBody}>
                Marca esta opcion para solicitar la comprobacion profesional.
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.field}>
            <Text style={styles.helperText}>Rellena una de las dos opciones</Text>
            <Text style={styles.label}>Numero de colegiacion</Text>
            <TextInput
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!isVerified}
              maxLength={40}
              placeholder="Ejemplo: M-12345"
              style={[styles.input, isVerified && styles.disabledInput]}
              value={collegiateNumber}
              onChangeText={setCollegiateNumber}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Descripcion o enlaces de verificacion</Text>
            <Text style={styles.helperText}>
              Puedes poner lo que ayude a comprobarlo: LinkedIn, Doctoralia, tu web profesional u otro enlace.
            </Text>
            <TextInput
              autoCapitalize="sentences"
              editable={!isVerified}
              multiline
              numberOfLines={4}
              placeholder="Ejemplo: perfil de Doctoralia, LinkedIn o web profesional"
              style={[
                styles.input,
                styles.descriptionInput,
                isVerified && styles.disabledInput,
              ]}
              textAlignVertical="top"
              value={verificationDescription}
              onChangeText={setVerificationDescription}
            />
          </View>

          <Text style={styles.requirementText}>
            Es necesario escribir el numero de colegiacion o la descripcion con referencias. No hace falta completar ambos.
          </Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {message ? <Text style={styles.successText}>{message}</Text> : null}

          <TouchableOpacity
            activeOpacity={0.82}
            disabled={!canSubmit}
            style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
            onPress={handleSubmit}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitButtonText}>Enviar para comprobar</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      <FooterApp />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#f4f6f3',
    flex: 1,
  },
  content: {
    alignSelf: 'center',
    maxWidth: 520,
    padding: 20,
    paddingBottom: 100,
    width: '100%',
  },
  header: {
    paddingBottom: 18,
    paddingTop: 8,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#dce3dd',
    borderRadius: 8,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    marginBottom: 18,
    width: 42,
  },
  backIcon: {
    color: '#20352b',
    fontSize: 20,
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
  statusBox: {
    backgroundColor: '#eef3ee',
    borderColor: '#d4dfd7',
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    padding: 14,
  },
  statusHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusLabel: {
    color: '#20352b',
    fontSize: 14,
    fontWeight: '800',
  },
  statusChip: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  not_requestedChip: {
    backgroundColor: '#dce3dd',
  },
  pendingChip: {
    backgroundColor: '#f1d680',
  },
  verifiedChip: {
    backgroundColor: '#9bd5b4',
  },
  rejectedChip: {
    backgroundColor: '#efb8b2',
  },
  statusChipText: {
    color: '#17211b',
    fontSize: 12,
    fontWeight: '800',
  },
  statusMessage: {
    color: '#405348',
    fontSize: 14,
    lineHeight: 20,
  },
  form: {
    backgroundColor: '#ffffff',
    borderColor: '#dce3dd',
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
  },
  option: {
    alignItems: 'flex-start',
    backgroundColor: '#f8faf8',
    borderColor: '#d7e0d9',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    padding: 12,
  },
  disabledOption: {
    opacity: 0.72,
  },
  checkbox: {
    alignItems: 'center',
    borderColor: '#7b8f83',
    borderRadius: 5,
    borderWidth: 2,
    height: 24,
    justifyContent: 'center',
    marginTop: 1,
    width: 24,
  },
  checkboxChecked: {
    backgroundColor: '#20352b',
    borderColor: '#20352b',
  },
  checkboxIcon: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  optionCopy: {
    flex: 1,
  },
  optionTitle: {
    color: '#111814',
    fontSize: 15,
    fontWeight: '800',
  },
  optionBody: {
    color: '#526057',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
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
  descriptionInput: {
    minHeight: 96,
    paddingTop: 11,
  },
  helperText: {
    color: '#526057',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 8,
  },
  requirementText: {
    color: '#405348',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  disabledInput: {
    color: '#526057',
    opacity: 0.72,
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
