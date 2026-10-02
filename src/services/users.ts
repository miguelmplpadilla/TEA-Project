import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

import { getFirebaseFirestore } from '@/services/firebase';
import { MAX_PUBLICATION_IMAGES } from '@/constants/publications';
import {
  defaultTeaDiagnosis,
  isTeaDiagnosis,
  type TeaDiagnosis,
} from '@/constants/teaDiagnosis';
import {
  isReportReason,
  type ReportReason,
  type ReportTargetType,
} from '@/constants/reports';
import { notifyPsychologistVerification } from '@/services/formspree';

export type OnboardingOption = {
  label: string;
  value: string;
};

export type PsychologistVerificationStatus =
  | 'not_requested'
  | 'pending'
  | 'verified'
  | 'rejected';

export type PsychologistVerificationRequest = {
  uid: string;
  collegiateNumber: string;
  verificationDescription: string;
  declaredPsychologist: boolean;
  status: PsychologistVerificationStatus;
  requestedAt?: Date | null;
  updatedAt?: Date | null;
};

export type PsychologistVerificationInput = Pick<
  PsychologistVerificationRequest,
  'collegiateNumber' | 'verificationDescription' | 'declaredPsychologist'
>;

export type OnboardingProfile = {
  userName: string;
  teaDiagnosis: TeaDiagnosis;
  profileImageUri?: string | null;
  profileBackgroundUri?: string | null;
  profileImageUrl?: string | null;
  profileBackgroundUrl?: string | null;
  description: string;
  interests: string[];
  socialSkills: OnboardingOption[];
  comfortOptions: OnboardingOption[];
  lookingFor: OnboardingOption[];
  psychologistVerification?: PsychologistVerificationInput;
};

export type EditableUserProfile = Pick<
  OnboardingProfile,
  'teaDiagnosis' | 'description' | 'interests' | 'socialSkills' | 'comfortOptions' | 'lookingFor'
> & {
  profileImageUrl?: string | null;
  profileBackgroundUrl?: string | null;
  declaredPsychologist?: boolean;
};

export type UserProfile = {
  id?: string;
  uid: string;
  email: string | null;
  userName: string;
  userNameLower: string;
  teaDiagnosis: TeaDiagnosis;
  profileImageUrl?: string | null;
  profileBackgroundUrl?: string | null;
  description: string;
  interests: string[];
  socialSkills: OnboardingOption[];
  comfortOptions: OnboardingOption[];
  lookingFor: OnboardingOption[];
  savedPublicationIds: string[];
  savedCommentIds: string[];
  declaredPsychologist: boolean;
  psychologistVerificationStatus: PsychologistVerificationStatus;
  psychologistVerificationRequestedAt?: Date | null;
  psychologistAccreditationPromptPressedAt?: Date | null;
  psychologistVerifiedAt?: Date | null;
  repliesSeenAt?: Date | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
};

export type FriendshipStatus =
  | 'none'
  | 'self'
  | 'friends'
  | 'outgoing_pending'
  | 'incoming_pending';

export type FriendRequest = {
  id: string;
  fromUid: string;
  toUid: string;
  fromUserName: string;
  toUserName: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date | null;
  updatedAt: Date | null;
};

export type FriendAcceptedNotification = {
  id: string;
  fromUid: string;
  toUid: string;
  fromUserName: string;
  seenAt: Date | null;
  createdAt: Date | null;
};

export type Publication = {
  id: string;
  uid: string;
  title: string;
  interests: string[];
  description: string;
  imagesUrls: string[];
  comments: PublicationComment[];
  createdAt: Date | null;
  updatedAt: Date | null;
};

export type PublicationComment = {
  id: string;
  uid: string;
  userName: string;
  text: string;
  imagesUrls: string[];
  createdAt: Date | null;
};

export type PublicationReply = PublicationComment & {
  publicationId: string;
  publicationTitle: string;
};

export type ContentReport = {
  id?: string;
  reporterUid: string;
  targetType: ReportTargetType;
  targetId: string;
  targetOwnerUid?: string | null;
  reason: ReportReason;
  status: 'pending';
  createdAt?: Date | null;
  updatedAt?: Date | null;
};

export class UserNameAlreadyExistsError extends Error {
  constructor() {
    super('Ese nombre de usuario ya existe.');
    this.name = 'UserNameAlreadyExistsError';
  }
}

export function normalizeUserName(userName: string) {
  return userName.trim().replace(/^@+/, '').toLowerCase();
}

export function isValidUserName(userName: string) {
  return /^[a-z0-9._-]{3,20}$/.test(normalizeUserName(userName));
}

function timestampToDate(value: unknown) {
  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as Timestamp).toDate === 'function'
  ) {
    return (value as Timestamp).toDate();
  }

  return null;
}

function getPsychologistVerificationStatus(value: unknown): PsychologistVerificationStatus {
  if (
    value === 'pending' ||
    value === 'verified' ||
    value === 'rejected'
  ) {
    return value;
  }

  return 'not_requested';
}

function getFriendRequestId(firstUid: string, secondUid: string) {
  return [firstUid, secondUid].sort().join('_');
}

function getFriendshipId(firstUid: string, secondUid: string) {
  return [firstUid, secondUid].sort().join('_');
}

function mapFriendRequest(requestId: string, request: Record<string, unknown>): FriendRequest {
  const status =
    request.status === 'accepted' || request.status === 'rejected'
      ? request.status
      : 'pending';

  return {
    id: requestId,
    fromUid: typeof request.fromUid === 'string' ? request.fromUid : '',
    toUid: typeof request.toUid === 'string' ? request.toUid : '',
    fromUserName: typeof request.fromUserName === 'string' ? request.fromUserName : 'Usuario',
    toUserName: typeof request.toUserName === 'string' ? request.toUserName : 'Usuario',
    status,
    createdAt: timestampToDate(request.createdAt),
    updatedAt: timestampToDate(request.updatedAt),
  };
}

function mapFriendAcceptedNotification(
  notificationId: string,
  notification: Record<string, unknown>,
): FriendAcceptedNotification {
  return {
    id: notificationId,
    fromUid: typeof notification.fromUid === 'string' ? notification.fromUid : '',
    toUid: typeof notification.toUid === 'string' ? notification.toUid : '',
    fromUserName: typeof notification.fromUserName === 'string' ? notification.fromUserName : 'Usuario',
    seenAt: timestampToDate(notification.seenAt),
    createdAt: timestampToDate(notification.createdAt),
  };
}

function mapPublicationComment(comment: unknown): PublicationComment | null {
  if (!comment || typeof comment !== 'object') {
    return null;
  }

  const commentData = comment as Record<string, unknown>;
  const text = typeof commentData.text === 'string' ? commentData.text : '';
  const imagesUrls = Array.isArray(commentData.imagesUrls)
    ? commentData.imagesUrls.filter((url): url is string => typeof url === 'string')
    : [];

  if (!text.trim() && imagesUrls.length === 0) {
    return null;
  }

  return {
    id: typeof commentData.id === 'string' ? commentData.id : '',
    uid: typeof commentData.uid === 'string' ? commentData.uid : '',
    userName: typeof commentData.userName === 'string' ? commentData.userName : 'Usuario',
    text,
    imagesUrls: imagesUrls.slice(0, MAX_PUBLICATION_IMAGES),
    createdAt: timestampToDate(commentData.createdAt),
  };
}

function mapPublication(publicationId: string, publication: Record<string, unknown>): Publication {
  const imagesValue = Array.isArray(publication.imagesUrls)
    ? publication.imagesUrls
    : publication.imagesPost;

  return {
    id: publicationId,
    uid: typeof publication.uid === 'string' ? publication.uid : '',
    title: typeof publication.title === 'string' ? publication.title : '',
    interests: Array.isArray(publication.interests) ? publication.interests.filter((interest): interest is string => typeof interest === 'string') : [],
    description: typeof publication.description === 'string' ? publication.description : '',
    comments: Array.isArray(publication.comments)
      ? publication.comments
          .map(mapPublicationComment)
          .filter((comment): comment is PublicationComment => comment !== null)
      : [],
    createdAt: timestampToDate(publication.createdAt),
    updatedAt: timestampToDate(publication.updatedAt),
    imagesUrls: Array.isArray(imagesValue) ? imagesValue.filter((url): url is string => typeof url === 'string') : [],
  };
}

export async function isUserNameAvailable(userName: string) {
  const normalizedUserName = normalizeUserName(userName);

  if (!isValidUserName(normalizedUserName)) {
    return false;
  }

  const usernameSnapshot = await getDoc(
    doc(getFirebaseFirestore(), 'usernames', normalizedUserName),
  );

  return !usernameSnapshot.exists();
}

export async function createUserProfile({
  uid,
  email,
  profile,
}: {
  uid: string;
  email: string | null;
  profile: OnboardingProfile;
}) {
  const db = getFirebaseFirestore();
  const normalizedUserName = normalizeUserName(profile.userName);
  const cleanCollegiateNumber = profile.psychologistVerification?.collegiateNumber.trim() ?? '';
  const cleanVerificationDescription =
    profile.psychologistVerification?.verificationDescription.trim() ?? '';
  const requestsPsychologistVerification =
    profile.psychologistVerification?.declaredPsychologist === true &&
    (cleanCollegiateNumber.length > 0 || cleanVerificationDescription.length > 0);
  const declaredPsychologist = profile.psychologistVerification?.declaredPsychologist === true;

  if (!isValidUserName(normalizedUserName)) {
    throw new Error('El nombre de usuario debe tener entre 3 y 20 caracteres y solo puede usar letras, numeros, puntos, guiones y guiones bajos.');
  }

  await runTransaction(db, async (transaction) => {
    const userRef = doc(db, 'users', uid);
    const usernameRef = doc(db, 'usernames', normalizedUserName);
    const psychologistVerificationRef = doc(db, 'psychologistVerificationRequests', uid);
    const usernameSnapshot = await transaction.get(usernameRef);

    if (usernameSnapshot.exists()) {
      throw new UserNameAlreadyExistsError();
    }

    const now = serverTimestamp();

    transaction.set(userRef, {
      uid,
      email,
      userName: profile.userName.trim().replace(/^@+/, ''),
      userNameLower: normalizedUserName,
      teaDiagnosis: profile.teaDiagnosis,
      profileImageUrl: profile.profileImageUrl ?? null,
      profileBackgroundUrl: profile.profileBackgroundUrl ?? null,
      description: profile.description.trim(),
      interests: profile.interests,
      socialSkills: profile.socialSkills,
      comfortOptions: profile.comfortOptions,
      lookingFor: profile.lookingFor,
      savedPublicationIds: [],
      savedCommentIds: [],
      declaredPsychologist,
      psychologistVerificationStatus: requestsPsychologistVerification ? 'pending' : 'not_requested',
      psychologistVerificationRequestedAt: requestsPsychologistVerification ? now : null,
      psychologistAccreditationPromptPressedAt: requestsPsychologistVerification ? now : null,
      psychologistVerifiedAt: null,
      repliesSeenAt: null,
      createdAt: now,
      updatedAt: now,
    });

    transaction.set(usernameRef, {
      uid,
      userName: profile.userName.trim().replace(/^@+/, ''),
      createdAt: now,
    });

    if (requestsPsychologistVerification) {
      transaction.set(psychologistVerificationRef, {
        uid,
        collegiateNumber: cleanCollegiateNumber,
        verificationDescription: cleanVerificationDescription,
        declaredPsychologist: true,
        status: 'pending',
        requestedAt: now,
        updatedAt: now,
      });
    }
  });

  if (requestsPsychologistVerification) {
    void notifyPsychologistVerification({
      trigger: 'onboarding',
      uid,
      email,
      userName: profile.userName.trim().replace(/^@+/, ''),
      collegiateNumber: cleanCollegiateNumber,
      verificationDescription: cleanVerificationDescription,
    });
  }
}

export async function updateUserProfile({
  uid,
  profile,
}: {
  uid: string;
  profile: EditableUserProfile;
}) {
  const updates: Record<string, unknown> = {
    teaDiagnosis: profile.teaDiagnosis,
    description: profile.description.trim(),
    interests: profile.interests,
    socialSkills: profile.socialSkills,
    comfortOptions: profile.comfortOptions,
    lookingFor: profile.lookingFor,
    updatedAt: serverTimestamp(),
  };

  if (profile.profileImageUrl !== undefined) {
    updates.profileImageUrl = profile.profileImageUrl;
  }

  if (profile.profileBackgroundUrl !== undefined) {
    updates.profileBackgroundUrl = profile.profileBackgroundUrl;
  }

  if (profile.declaredPsychologist !== undefined) {
    updates.declaredPsychologist = profile.declaredPsychologist;
  }

  await updateDoc(doc(getFirebaseFirestore(), 'users', uid), updates);
}

export async function getPsychologistVerificationRequest(uid: string) {
  const requestSnapshot = await getDoc(
    doc(getFirebaseFirestore(), 'psychologistVerificationRequests', uid),
  );

  if (!requestSnapshot.exists()) {
    return null;
  }

  const request = requestSnapshot.data();

  return {
    uid: typeof request.uid === 'string' ? request.uid : uid,
    collegiateNumber:
      typeof request.collegiateNumber === 'string' ? request.collegiateNumber : '',
    verificationDescription:
      typeof request.verificationDescription === 'string' ? request.verificationDescription : '',
    declaredPsychologist: request.declaredPsychologist === true,
    status: getPsychologistVerificationStatus(request.status),
    requestedAt: timestampToDate(request.requestedAt),
    updatedAt: timestampToDate(request.updatedAt),
  } satisfies PsychologistVerificationRequest;
}

export async function requestPsychologistVerification({
  uid,
  collegiateNumber,
  verificationDescription,
}: {
  uid: string;
  collegiateNumber: string;
  verificationDescription: string;
}) {
  const cleanCollegiateNumber = collegiateNumber.trim();
  const cleanVerificationDescription = verificationDescription.trim();

  if (!cleanCollegiateNumber && !cleanVerificationDescription) {
    throw new Error('Introduce el numero de colegiacion o una descripcion con enlaces.');
  }

  const db = getFirebaseFirestore();
  const userRef = doc(db, 'users', uid);
  const requestRef = doc(db, 'psychologistVerificationRequests', uid);
  let notificationEmail: string | null = null;
  let notificationUserName = '';

  await runTransaction(db, async (transaction) => {
    const userSnapshot = await transaction.get(userRef);

    if (!userSnapshot.exists()) {
      throw new Error('No se encontro el perfil del usuario.');
    }

    if (getPsychologistVerificationStatus(userSnapshot.data().psychologistVerificationStatus) === 'verified') {
      throw new Error('Tu acreditacion ya esta verificada.');
    }

    const userData = userSnapshot.data();
    notificationEmail = typeof userData.email === 'string' ? userData.email : null;
    notificationUserName = typeof userData.userName === 'string' ? userData.userName : '';

    const now = serverTimestamp();

    transaction.set(requestRef, {
      uid,
      collegiateNumber: cleanCollegiateNumber,
      verificationDescription: cleanVerificationDescription,
      declaredPsychologist: true,
      status: 'pending',
      requestedAt: now,
      updatedAt: now,
    }, { merge: true });

    transaction.update(userRef, {
      declaredPsychologist: true,
      psychologistVerificationStatus: 'pending',
      psychologistVerificationRequestedAt: now,
      psychologistAccreditationPromptPressedAt: now,
      updatedAt: now,
    });
  });

  void notifyPsychologistVerification({
    trigger: 'verification_request',
    uid,
    email: notificationEmail,
    userName: notificationUserName,
    collegiateNumber: cleanCollegiateNumber,
    verificationDescription: cleanVerificationDescription,
  });
}

export async function markPsychologistAccreditationPromptPressed(uid: string) {
  const db = getFirebaseFirestore();
  const userRef = doc(db, 'users', uid);
  let notificationEmail: string | null = null;
  let notificationUserName = '';

  await runTransaction(db, async (transaction) => {
    const userSnapshot = await transaction.get(userRef);

    if (!userSnapshot.exists()) {
      throw new Error('No se encontro el perfil del usuario.');
    }

    const userData = userSnapshot.data();
    notificationEmail = typeof userData.email === 'string' ? userData.email : null;
    notificationUserName = typeof userData.userName === 'string' ? userData.userName : '';

    transaction.update(userRef, {
      declaredPsychologist: true,
      psychologistAccreditationPromptPressedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });

  void notifyPsychologistVerification({
    trigger: 'profile_button',
    uid,
    email: notificationEmail,
    userName: notificationUserName,
  });
}

export async function getFriendshipStatus({
  currentUid,
  targetUid,
}: {
  currentUid: string;
  targetUid: string;
}): Promise<FriendshipStatus> {
  if (currentUid === targetUid) {
    return 'self';
  }

  const friendshipSnapshot = await getDoc(
    doc(getFirebaseFirestore(), 'friendships', getFriendshipId(currentUid, targetUid)),
  ).catch(() => null);

  if (friendshipSnapshot?.exists()) {
    return 'friends';
  }

  const requestSnapshot = await getDoc(
    doc(getFirebaseFirestore(), 'friendRequests', getFriendRequestId(currentUid, targetUid)),
  ).catch(() => null);

  if (!requestSnapshot?.exists()) {
    return 'none';
  }

  const request = mapFriendRequest(requestSnapshot.id, requestSnapshot.data());

  if (request.status !== 'pending') {
    return 'none';
  }

  return request.fromUid === currentUid ? 'outgoing_pending' : 'incoming_pending';
}

export async function sendFriendRequest({
  fromUid,
  toUid,
}: {
  fromUid: string;
  toUid: string;
}) {
  if (fromUid === toUid) {
    throw new Error('No puedes enviarte una solicitud a ti mismo.');
  }

  const db = getFirebaseFirestore();
  const requestRef = doc(db, 'friendRequests', getFriendRequestId(fromUid, toUid));

  await runTransaction(db, async (transaction) => {
    const fromUserRef = doc(db, 'users', fromUid);
    const toUserRef = doc(db, 'users', toUid);
    const [fromUserSnapshot, toUserSnapshot] = await Promise.all([
      transaction.get(fromUserRef),
      transaction.get(toUserRef),
    ]);

    if (!fromUserSnapshot.exists() || !toUserSnapshot.exists()) {
      throw new Error('No se encontro uno de los usuarios.');
    }

    const fromUser = fromUserSnapshot.data();
    const toUser = toUserSnapshot.data();

    const now = serverTimestamp();

    transaction.set(requestRef, {
      fromUid,
      toUid,
      fromUserName: typeof fromUser.userName === 'string' ? fromUser.userName : 'Usuario',
      toUserName: typeof toUser.userName === 'string' ? toUser.userName : 'Usuario',
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    });
  });
}

export async function getPendingFriendRequestsForUser(uid: string) {
  const requestsSnapshot = await getDocs(
    query(collection(getFirebaseFirestore(), 'friendRequests'), where('toUid', '==', uid)),
  );

  return requestsSnapshot.docs
    .map((requestDoc) => mapFriendRequest(requestDoc.id, requestDoc.data()))
    .filter((request) => request.toUid === uid && request.status === 'pending')
    .sort((firstRequest, secondRequest) => {
      const firstTime = firstRequest.createdAt?.getTime() ?? 0;
      const secondTime = secondRequest.createdAt?.getTime() ?? 0;

      return secondTime - firstTime;
    });
}

export async function acceptFriendRequest(requestId: string) {
  const db = getFirebaseFirestore();
  const requestRef = doc(db, 'friendRequests', requestId);

  await runTransaction(db, async (transaction) => {
    const requestSnapshot = await transaction.get(requestRef);

    if (!requestSnapshot.exists()) {
      throw new Error('No se encontro la solicitud.');
    }

    const request = mapFriendRequest(requestSnapshot.id, requestSnapshot.data());

    if (request.status !== 'pending') {
      throw new Error('La solicitud ya no esta pendiente.');
    }

    const friendshipRef = doc(db, 'friendships', getFriendshipId(request.fromUid, request.toUid));
    const notificationRef = doc(collection(db, 'friendNotifications'));
    const now = serverTimestamp();

    transaction.set(friendshipRef, {
      uids: [request.fromUid, request.toUid],
      userNames: {
        [request.fromUid]: request.fromUserName,
        [request.toUid]: request.toUserName,
      },
      requestedByUid: request.fromUid,
      acceptedByUid: request.toUid,
      createdAt: now,
      updatedAt: now,
    });
    transaction.update(requestRef, {
      status: 'accepted',
      updatedAt: now,
    });
    transaction.set(notificationRef, {
      fromUid: request.toUid,
      toUid: request.fromUid,
      fromUserName: request.toUserName,
      type: 'friend_request_accepted',
      seenAt: null,
      createdAt: now,
    });
  });
}

export async function rejectFriendRequest(requestId: string) {
  await updateDoc(doc(getFirebaseFirestore(), 'friendRequests', requestId), {
    status: 'rejected',
    updatedAt: serverTimestamp(),
  });
}

export async function getFriendAcceptedNotificationsForUser(uid: string) {
  const notificationsSnapshot = await getDocs(
    query(collection(getFirebaseFirestore(), 'friendNotifications'), where('toUid', '==', uid)),
  );

  return notificationsSnapshot.docs
    .map((notificationDoc) =>
      mapFriendAcceptedNotification(notificationDoc.id, notificationDoc.data()),
    )
    .filter((notification) => notification.toUid === uid)
    .sort((firstNotification, secondNotification) => {
      const firstTime = firstNotification.createdAt?.getTime() ?? 0;
      const secondTime = secondNotification.createdAt?.getTime() ?? 0;

      return secondTime - firstTime;
    });
}

export async function markFriendAcceptedNotificationsSeenForUser(uid: string) {
  const notifications = await getFriendAcceptedNotificationsForUser(uid);
  const unseenNotifications = notifications.filter((notification) => !notification.seenAt);

  await Promise.all(
    unseenNotifications.map((notification) =>
      updateDoc(doc(getFirebaseFirestore(), 'friendNotifications', notification.id), {
        seenAt: serverTimestamp(),
      }),
    ),
  );
}

export async function getUnreadFriendActivityCount(uid: string) {
  const [pendingRequests, acceptedNotifications] = await Promise.all([
    getPendingFriendRequestsForUser(uid),
    getFriendAcceptedNotificationsForUser(uid),
  ]);

  return pendingRequests.length + acceptedNotifications.filter((notification) => !notification.seenAt).length;
}

export async function getUnreadActivityCount(uid: string) {
  const [unreadRepliesCount, unreadFriendActivityCount] = await Promise.all([
    getUnreadRepliesCount(uid),
    getUnreadFriendActivityCount(uid),
  ]);

  return unreadRepliesCount + unreadFriendActivityCount;
}

export async function getFriendsForUser(uid: string) {
  const friendshipSnapshot = await getDocs(
    query(collection(getFirebaseFirestore(), 'friendships'), where('uids', 'array-contains', uid)),
  );

  const friendUids = friendshipSnapshot.docs
    .map((friendshipDoc) => {
      const uids = friendshipDoc.data().uids;

      if (!Array.isArray(uids)) {
        return '';
      }

      return uids.find((friendUid): friendUid is string => typeof friendUid === 'string' && friendUid !== uid) ?? '';
    })
    .filter((friendUid) => friendUid.length > 0);

  const friends = await Promise.all(friendUids.map((friendUid) => getUserById(friendUid)));

  return friends.filter((friend): friend is UserProfile => friend !== null);
}

export async function getMutualFriends({
  currentUid,
  targetUid,
}: {
  currentUid: string;
  targetUid: string;
}) {
  const currentFriendshipSnapshot = await getDocs(
    query(collection(getFirebaseFirestore(), 'friendships'), where('uids', 'array-contains', currentUid)),
  );

  const currentFriendUids = currentFriendshipSnapshot.docs
    .map((friendshipDoc) => {
      const uids = friendshipDoc.data().uids;

      if (!Array.isArray(uids)) {
        return '';
      }

      return uids.find((uid): uid is string => typeof uid === 'string' && uid !== currentUid) ?? '';
    })
    .filter((friendUid) => friendUid.length > 0);

  const mutualFriendUids: string[] = [];

  await Promise.all(
    currentFriendUids.map(async (friendUid) => {
      const targetFriendshipSnapshot = await getDoc(
        doc(getFirebaseFirestore(), 'friendships', getFriendshipId(targetUid, friendUid)),
      ).catch(() => null);

      if (targetFriendshipSnapshot?.exists()) {
        mutualFriendUids.push(friendUid);
      }
    }),
  );

  const mutualFriends = await Promise.all(mutualFriendUids.map((friendUid) => getUserById(friendUid)));

  return mutualFriends.filter((friend): friend is UserProfile => friend !== null);
}

export async function createPublication({uid,title,interests,description, imagesUrls}: {
  uid: string;
  title: string;
  interests: string[];
  description: string;
  imagesUrls: string[];
}) {
  if (imagesUrls.length > MAX_PUBLICATION_IMAGES) {
    throw new Error(`Solo puedes publicar hasta ${MAX_PUBLICATION_IMAGES} imagenes.`);
  }

  const db = getFirebaseFirestore();
  const publicationRef = doc(collection(db, 'publications'));

  await setDoc(publicationRef, {
    uid,
    title: title.trim(),
    interests,
    description: description.trim(),
    comments: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    imagesUrls,
  });

  return publicationRef.id;
}

export async function createContentReport({
  reporterUid,
  targetType,
  targetId,
  targetOwnerUid,
  reason,
}: {
  reporterUid: string;
  targetType: ReportTargetType;
  targetId: string;
  targetOwnerUid?: string | null;
  reason: ReportReason;
}) {
  if (!reporterUid.trim()) {
    throw new Error('No se encontro el usuario que reporta.');
  }

  if (!targetId.trim()) {
    throw new Error('No se encontro el contenido a reportar.');
  }

  if (!isReportReason(reason)) {
    throw new Error('Selecciona un motivo de reporte valido.');
  }

  const reportRef = doc(collection(getFirebaseFirestore(), 'reports'));
  const now = serverTimestamp();

  await setDoc(reportRef, {
    reporterUid,
    targetType,
    targetId,
    targetOwnerUid: targetOwnerUid ?? null,
    reason,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  });

  return reportRef.id;
}

export async function getPublications(): Promise<Publication[]> {
  const db = getFirebaseFirestore();
  const publicationsQuery = query(
    collection(db, 'publications'),
    orderBy('createdAt', 'desc'),
  );
  const publicationsSnapshot = await getDocs(publicationsQuery);

  return publicationsSnapshot.docs.map((publicationDoc) =>
    mapPublication(publicationDoc.id, publicationDoc.data()),
  );
}

export async function getRepliesForUser(uid: string): Promise<PublicationReply[]> {
  const publications = await getPublications();

  return publications
    .filter((publication) => publication.uid === uid)
    .flatMap((publication) =>
      publication.comments
        .filter((comment) => comment.uid !== uid)
        .map((comment): PublicationReply => ({
          ...comment,
          publicationId: publication.id,
          publicationTitle: publication.title,
        })),
    )
    .sort((firstReply, secondReply) => {
      const firstTime = firstReply.createdAt?.getTime() ?? 0;
      const secondTime = secondReply.createdAt?.getTime() ?? 0;

      return secondTime - firstTime;
    });
}

export async function getUnreadRepliesCount(uid: string) {
  const [profile, replies] = await Promise.all([
    getUserById(uid),
    getRepliesForUser(uid),
  ]);
  const repliesSeenAt = profile?.repliesSeenAt?.getTime() ?? 0;

  return replies.filter((reply) => (reply.createdAt?.getTime() ?? 0) > repliesSeenAt).length;
}

export async function markRepliesSeenForUser(uid: string) {
  await updateDoc(doc(getFirebaseFirestore(), 'users', uid), {
    repliesSeenAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function getPublicationById(publicationId: string): Promise<Publication | null> {
  const publicationSnapshot = await getDoc(
    doc(getFirebaseFirestore(), 'publications', publicationId),
  );

  if (!publicationSnapshot.exists()) {
    return null;
  }

  return mapPublication(publicationSnapshot.id, publicationSnapshot.data());
}

export async function addCommentToPublication({
  publicationId,
  uid,
  userName,
  text,
  imagesUrls = [],
}: {
  publicationId: string;
  uid: string;
  userName: string;
  text: string;
  imagesUrls?: string[];
}) {
  const cleanText = text.trim();
  const cleanImageUrls = imagesUrls
    .filter((url): url is string => typeof url === 'string' && url.trim().length > 0)
    .slice(0, MAX_PUBLICATION_IMAGES);

  if (!cleanText && cleanImageUrls.length === 0) {
    throw new Error('El comentario no puede estar vacio.');
  }

  if (imagesUrls.length > MAX_PUBLICATION_IMAGES) {
    throw new Error(`Solo puedes comentar hasta ${MAX_PUBLICATION_IMAGES} imagenes.`);
  }

  const now = Timestamp.now();
  const comment = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    uid,
    userName: userName.trim() || 'Usuario',
    text: cleanText,
    imagesUrls: cleanImageUrls,
    createdAt: now,
  };

  await updateDoc(doc(getFirebaseFirestore(), 'publications', publicationId), {
    comments: arrayUnion(comment),
    updatedAt: serverTimestamp(),
  });

  return {
    ...comment,
    createdAt: now.toDate(),
  };
}

export function createSavedCommentId(publicationId: string, commentId: string) {
  return `${publicationId}:${commentId}`;
}

export async function savePublicationForUser(uid: string, publicationId: string) {
  await updateDoc(doc(getFirebaseFirestore(), 'users', uid), {
    savedPublicationIds: arrayUnion(publicationId),
    updatedAt: serverTimestamp(),
  });
}

export async function removeSavedPublicationForUser(uid: string, publicationId: string) {
  await updateDoc(doc(getFirebaseFirestore(), 'users', uid), {
    savedPublicationIds: arrayRemove(publicationId),
    updatedAt: serverTimestamp(),
  });
}

export async function saveCommentForUser(uid: string, publicationId: string, commentId: string) {
  await updateDoc(doc(getFirebaseFirestore(), 'users', uid), {
    savedCommentIds: arrayUnion(createSavedCommentId(publicationId, commentId)),
    updatedAt: serverTimestamp(),
  });
}

export async function removeSavedCommentForUser(uid: string, publicationId: string, commentId: string) {
  await updateDoc(doc(getFirebaseFirestore(), 'users', uid), {
    savedCommentIds: arrayRemove(createSavedCommentId(publicationId, commentId)),
    updatedAt: serverTimestamp(),
  });
}

export async function getUserById(uid: string): Promise<UserProfile | null> {
  const userRef = doc(getFirebaseFirestore(), 'users', uid);
  const userSnapshot = await getDoc(userRef);

  if (!userSnapshot.exists()) {
    return null;
  }

  const user = userSnapshot.data();

  return {
    id: userSnapshot.id,
    uid: typeof user.uid === 'string' ? user.uid : '',
    email: typeof user.email === 'string' ? user.email : null,
    userName: typeof user.userName === 'string' ? user.userName : '',
    userNameLower: typeof user.userNameLower === 'string' ? user.userNameLower : '',
    teaDiagnosis: isTeaDiagnosis(user.teaDiagnosis) ? user.teaDiagnosis : defaultTeaDiagnosis,
    profileImageUrl: typeof user.profileImageUrl === 'string' ? user.profileImageUrl : null,
    profileBackgroundUrl: typeof user.profileBackgroundUrl === 'string' ? user.profileBackgroundUrl : null,
    description: typeof user.description === 'string' ? user.description : '',
    interests: Array.isArray(user.interests) ? user.interests : [],
    socialSkills: Array.isArray(user.socialSkills) ? user.socialSkills : [],
    comfortOptions: Array.isArray(user.comfortOptions) ? user.comfortOptions : [],
    lookingFor: Array.isArray(user.lookingFor) ? user.lookingFor : [],
    savedPublicationIds: Array.isArray(user.savedPublicationIds)
      ? user.savedPublicationIds.filter((publicationId): publicationId is string => typeof publicationId === 'string')
      : [],
    savedCommentIds: Array.isArray(user.savedCommentIds)
      ? user.savedCommentIds.filter((commentId): commentId is string => typeof commentId === 'string')
      : [],
    declaredPsychologist: user.declaredPsychologist === true,
    psychologistVerificationStatus: getPsychologistVerificationStatus(user.psychologistVerificationStatus),
    psychologistVerificationRequestedAt: timestampToDate(user.psychologistVerificationRequestedAt),
    psychologistAccreditationPromptPressedAt: timestampToDate(user.psychologistAccreditationPromptPressedAt),
    psychologistVerifiedAt: timestampToDate(user.psychologistVerifiedAt),
    repliesSeenAt: timestampToDate(user.repliesSeenAt),
    createdAt: timestampToDate(user.createdAt),
    updatedAt: timestampToDate(user.updatedAt),
  };
}
