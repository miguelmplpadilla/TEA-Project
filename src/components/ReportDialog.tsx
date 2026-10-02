import {FirebaseError} from 'firebase/app';
import {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {InfoPopup} from '@/components/InfoPopup';
import {
  reportReasons,
  type ReportReason,
  type ReportTargetType,
} from '@/constants/reports';
import {getFirebaseAuth} from '@/services/firebase';
import {createContentReport} from '@/services/users';

type ReportDialogProps = {
  visible: boolean;
  targetType: ReportTargetType;
  targetId: string;
  targetOwnerUid?: string | null;
  onClose: () => void;
};

const targetLabels: Record<ReportTargetType, string> = {
  profile: 'perfil',
  publication: 'publicacion',
};

export function ReportDialog({
  visible,
  targetType,
  targetId,
  targetOwnerUid,
  onClose,
}: ReportDialogProps) {
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!visible) {
      setSelectedReason(null);
      setError('');
      setSuccess('');
      setIsSubmitting(false);
    }
  }, [visible]);

  async function submitReport() {
    const authUser = getFirebaseAuth().currentUser;

    if (!authUser) {
      setError('Necesitas iniciar sesion para reportar.');
      return;
    }

    if (!targetId) {
      setError('No se encontro el contenido a reportar.');
      return;
    }

    if (!selectedReason) {
      setError('Selecciona un motivo.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await createContentReport({
        reporterUid: authUser.uid,
        targetType,
        targetId,
        targetOwnerUid,
        reason: selectedReason,
      });
      setSuccess('Reporte enviado para revision.');
    } catch (submitError) {
      if (submitError instanceof FirebaseError) {
        setError(`No se pudo enviar el reporte. Firebase: ${submitError.code}.`);
      } else {
        setError(
          submitError instanceof Error
            ? submitError.message
            : 'No se pudo enviar el reporte.',
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <InfoPopup
      visible={visible}
      title={`Reportar ${targetLabels[targetType]}`}
      body="Selecciona el motivo para que el equipo pueda revisarlo."
      onClose={onClose}
    >
      <View style={styles.reasons}>
        {reportReasons.map((reason) => {
          const selected = selectedReason === reason;

          return (
            <TouchableOpacity
              key={reason}
              activeOpacity={0.78}
              disabled={isSubmitting || Boolean(success)}
              style={[styles.reason, selected && styles.selectedReason]}
              onPress={() => setSelectedReason(reason)}
            >
              <Text style={[styles.reasonText, selected && styles.selectedReasonText]}>
                {reason}
              </Text>
              {selected ? <View style={styles.selectionDot} /> : null}
            </TouchableOpacity>
          );
        })}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {success ? <Text style={styles.successText}>{success}</Text> : null}

      {success ? (
        <TouchableOpacity activeOpacity={0.82} style={styles.submitButton} onPress={onClose}>
          <Text style={styles.submitButtonText}>Cerrar</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          activeOpacity={0.82}
          disabled={!selectedReason || isSubmitting}
          style={[
            styles.submitButton,
            (!selectedReason || isSubmitting) && styles.disabledButton,
          ]}
          onPress={submitReport}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitButtonText}>Enviar reporte</Text>
          )}
        </TouchableOpacity>
      )}
    </InfoPopup>
  );
}

const styles = StyleSheet.create({
  reasons: {
    gap: 7,
    marginTop: 14,
  },
  reason: {
    alignItems: 'center',
    backgroundColor: '#f8faf8',
    borderColor: '#d7e0d9',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    minHeight: 40,
    paddingHorizontal: 11,
  },
  selectedReason: {
    backgroundColor: '#eef3ee',
    borderColor: '#20352b',
  },
  reasonText: {
    color: '#405348',
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
  },
  selectedReasonText: {
    color: '#20352b',
  },
  selectionDot: {
    backgroundColor: '#20352b',
    borderRadius: 999,
    height: 10,
    width: 10,
  },
  errorText: {
    color: '#a33b30',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 10,
  },
  successText: {
    color: '#1e6a45',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 10,
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: '#20352b',
    borderRadius: 8,
    justifyContent: 'center',
    marginTop: 14,
    minHeight: 46,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  disabledButton: {
    opacity: 0.45,
  },
});
