import { FirebaseError } from 'firebase/app';
import { createUserWithEmailAndPassword, deleteUser, signInWithEmailAndPassword } from 'firebase/auth';

import { uploadOptionalImageToCloudinary } from '@/services/cloudinary';
import { getFirebaseAuth } from '@/services/firebase';
import {
  createUserProfile,
  type OnboardingProfile,
  UserNameAlreadyExistsError,
} from '@/services/users';

type RegisterWithEmailInput = {
  email: string;
  password: string;
  profile?: OnboardingProfile;
};

export async function registerWithEmail({ email, password, profile }: RegisterWithEmailInput) {
  const auth = getFirebaseAuth();
  const cleanEmail = email.trim().toLowerCase();
  const profileImageUrl = profile
    ? await uploadOptionalImageToCloudinary(
        profile.profileImageUri,
        `${profile.userName}-profile`,
      )
    : null;
  const profileBackgroundUrl = profile
    ? await uploadOptionalImageToCloudinary(
        profile.profileBackgroundUri,
        `${profile.userName}-background`,
      )
    : null;

  const credential = await createUserWithEmailAndPassword(auth, cleanEmail, password);

  if (!profile) {
    return credential.user;
  }

  try {
    await createUserProfile({
      uid: credential.user.uid,
      email: credential.user.email,
      profile: {
        ...profile,
        profileImageUrl,
        profileBackgroundUrl,
      },
    });
  } catch (profileError) {
    try {
      await deleteUser(credential.user);
    } catch {
      // If rollback fails, keep the original Firestore/profile error for the UI.
    }

    throw profileError;
  }

  return credential.user;
}

export async function loginWithEmail({email, password}: {email: string; password: string}) {
  const auth = getFirebaseAuth();
  const cleanEmail = email.trim().toLowerCase();

  const credential = await signInWithEmailAndPassword(auth, cleanEmail, password);

  return credential.user;
}

export function getAuthErrorMessage(error: unknown) {
  if (error instanceof UserNameAlreadyExistsError) {
    return 'Ese nombre de usuario ya existe. Elige otro.';
  }

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
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Email o contrasena incorrectos.';
    case 'auth/network-request-failed':
      return 'No se pudo conectar con Firebase. Revisa la conexion.';
    case 'permission-denied':
      return 'Firestore rechazo guardar el perfil. Revisa las reglas de seguridad.';
    case 'unavailable':
      return 'No se pudo conectar con Firestore. Intentalo de nuevo.';
    default:
      return 'Firebase rechazo el registro. Revisa la configuracion del proyecto.';
  }
}
