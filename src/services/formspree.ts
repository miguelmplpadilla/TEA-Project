const PSYCHOLOGIST_NOTIFICATION_EMAIL = 'miguelpadillal@hotmail.es';
const formspreeEndpoint = process.env.EXPO_PUBLIC_FORMSPREE_PSYCHOLOGIST_ENDPOINT;

type PsychologistNotificationInput = {
  trigger: 'onboarding' | 'profile_button' | 'verification_request';
  uid: string;
  email?: string | null;
  userName?: string;
  collegiateNumber?: string;
  verificationDescription?: string;
};

export async function sendPsychologistVerificationNotification({
  trigger,
  uid,
  email,
  userName,
  collegiateNumber,
  verificationDescription,
}: PsychologistNotificationInput) {
  if (!formspreeEndpoint) {
    return false;
  }

  const response = await fetch(formspreeEndpoint, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      subject: 'Solicitud de acreditacion de psicologia',
      to: PSYCHOLOGIST_NOTIFICATION_EMAIL,
      trigger,
      uid,
      email: email ?? '',
      userName: userName ?? '',
      collegiateNumber: collegiateNumber ?? '',
      verificationDescription: verificationDescription ?? '',
    }),
  });

  if (!response.ok) {
    throw new Error('Formspree rechazo la notificacion.');
  }

  return true;
}

export async function notifyPsychologistVerification(input: PsychologistNotificationInput) {
  try {
    await sendPsychologistVerificationNotification(input);
  } catch (error) {
    console.warn('No se pudo enviar la notificacion de acreditacion.', error);
  }
}
