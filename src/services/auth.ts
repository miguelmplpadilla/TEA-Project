import { FirebaseError } from 'firebase/app';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

import { getFirebaseAuth } from '@/services/firebase';

type RegisterWithEmailInput = {
  email: string;
  password: string;
};

export async function registerWithEmail({ email, password }: RegisterWithEmailInput) {
  const auth = getFirebaseAuth();
  const cleanEmail = email.trim().toLowerCase();

  const credential = await createUserWithEmailAndPassword(auth, cleanEmail, password);

  return credential.user;
}

export function getAuthErrorMessage(error: unknown) {
  if (!(error instanceof FirebaseError)) {
    return error instanceof Error ? error.message : 'No se pudo crear la cuenta.';
  }

  switch (error.code) {
    case 'auth/email-already-in-use':
      return 'Ese email ya tiene una cuenta registrada.';
    case 'auth/invalid-email':
      return 'El email no tiene un formato valido.';
    case 'auth/weak-password':
      return 'La contrasena debe tener al menos 6 caracteres.';
    case 'auth/network-request-failed':
      return 'No se pudo conectar con Firebase. Revisa la conexion.';
    default:
      return 'Firebase rechazo el registro. Revisa la configuracion del proyecto.';
  }
}
