import {FirebaseError} from 'firebase/app';
import {router} from 'expo-router';
import {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';

import {FooterApp} from '@/components/Footer';
import {UserNameWithDiagnosis} from '@/components/UserNameWithDiagnosis';
import {getFirebaseAuth} from '@/services/firebase';
import {
  acceptFriendRequest,
  getPendingFriendRequestsForUser,
  rejectFriendRequest,
  type FriendRequest,
} from '@/services/users';

export default function FriendRequests() {
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeRequestId, setActiveRequestId] = useState('');
  const [error, setError] = useState('');

  async function loadRequests() {
    const authUser = getFirebaseAuth().currentUser;

    if (!authUser) {
      setError('Necesitas iniciar sesion para ver tus solicitudes.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const nextRequests = await getPendingFriendRequestsForUser(authUser.uid);
      setRequests(nextRequests);
    } catch (loadError) {
      if (loadError instanceof FirebaseError) {
        setError(`No se pudieron cargar las solicitudes. Firebase: ${loadError.code}.`);
        return;
      }

      setError('No se pudieron cargar las solicitudes.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

  async function handleAccept(requestId: string) {
    setActiveRequestId(requestId);
    setError('');

    try {
      await acceptFriendRequest(requestId);
      setRequests((currentRequests) =>
        currentRequests.filter((request) => request.id !== requestId),
      );
    } catch (acceptError) {
      setError(
        acceptError instanceof Error
          ? acceptError.message
          : 'No se pudo aceptar la solicitud.',
      );
    } finally {
      setActiveRequestId('');
    }
  }

  async function handleReject(requestId: string) {
    setActiveRequestId(requestId);
    setError('');

    try {
      await rejectFriendRequest(requestId);
      setRequests((currentRequests) =>
        currentRequests.filter((request) => request.id !== requestId),
      );
    } catch (rejectError) {
      setError(
        rejectError instanceof Error
          ? rejectError.message
          : 'No se pudo rechazar la solicitud.',
      );
    } finally {
      setActiveRequestId('');
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" style={styles.iconButtonText} />
          </TouchableOpacity>
        </View>

        <View style={styles.header}>
          <Text style={styles.eyebrow}>TEARS</Text>
          <Text style={styles.title}>Solicitudes</Text>
          <Text style={styles.subtitle}>Personas que quieren confirmar una amistad contigo.</Text>
        </View>

        {isLoading ? <ActivityIndicator color="#20352b" style={styles.loader} /> : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {!isLoading && !error && requests.length === 0 ? (
          <Text style={styles.emptyText}>No tienes solicitudes pendientes.</Text>
        ) : null}

        <View style={styles.requestList}>
          {requests.map((request) => {
            const isBusy = activeRequestId === request.id;

            return (
              <View key={request.id} style={styles.requestCard}>
                <Pressable
                  style={({pressed}) => [styles.requestIdentity, pressed && styles.pressed]}
                  onPress={() => router.push(`/Profile?uid=${encodeURIComponent(request.fromUid)}`)}
                >
                  <UserNameWithDiagnosis
                    userName={request.fromUserName}
                    uid={request.fromUid}
                    size="small"
                    nameStyle={styles.requestName}
                  />
                  <Text style={styles.requestDate}>{formatDate(request.createdAt)}</Text>
                </Pressable>

                <View style={styles.requestActions}>
                  <TouchableOpacity
                    activeOpacity={0.82}
                    disabled={isBusy}
                    style={[styles.actionButton, styles.acceptButton, isBusy && styles.disabledButton]}
                    onPress={() => handleAccept(request.id)}
                  >
                    {isBusy ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <Text style={styles.acceptButtonText}>Aceptar</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.82}
                    disabled={isBusy}
                    style={[styles.actionButton, styles.rejectButton, isBusy && styles.disabledButton]}
                    onPress={() => handleReject(request.id)}
                  >
                    <Text style={styles.rejectButtonText}>Rechazar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <FooterApp />
    </SafeAreaView>
  );
}

function formatDate(date: Date | null) {
  if (!date) {
    return '';
  }

  return date.toLocaleDateString();
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#f4f6f3',
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 92,
  },
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: '#444',
    borderRadius: 8,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  iconButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  header: {
    marginBottom: 18,
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
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
  },
  subtitle: {
    color: '#526057',
    fontSize: 16,
    lineHeight: 23,
    marginTop: 8,
  },
  loader: {
    marginTop: 16,
  },
  errorText: {
    color: '#a33b30',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  emptyText: {
    color: '#65736a',
    fontSize: 14,
    lineHeight: 20,
  },
  requestList: {
    gap: 10,
  },
  requestCard: {
    backgroundColor: '#ffffff',
    borderColor: '#dce3dd',
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
  },
  requestIdentity: {
    marginBottom: 12,
  },
  pressed: {
    opacity: 0.74,
  },
  requestName: {
    color: '#17211b',
    fontSize: 15,
    fontWeight: '800',
  },
  requestDate: {
    color: '#65736a',
    fontSize: 12,
    marginTop: 4,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    alignItems: 'center',
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
    minHeight: 42,
  },
  acceptButton: {
    backgroundColor: '#20352b',
  },
  rejectButton: {
    backgroundColor: '#eef1ef',
    borderColor: '#d4dbd7',
    borderWidth: 1,
  },
  acceptButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  rejectButtonText: {
    color: '#20352b',
    fontSize: 14,
    fontWeight: '800',
  },
  disabledButton: {
    opacity: 0.58,
  },
});
