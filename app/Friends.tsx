import {FirebaseError} from 'firebase/app';
import {router, useLocalSearchParams} from 'expo-router';
import {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Image,
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
  getFriendsForUser,
  getMutualFriends,
  getUserById,
  type UserProfile,
} from '@/services/users';

export default function Friends() {
  const {uid, mode} = useLocalSearchParams<{uid?: string | string[]; mode?: string | string[]}>();
  const profileUid = Array.isArray(uid) ? uid[0] : uid;
  const listMode = Array.isArray(mode) ? mode[0] : mode;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadFriends() {
      const authUser = getFirebaseAuth().currentUser;

      if (!authUser || !profileUid) {
        setError('No se pudo cargar la lista de amistades.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError('');

      try {
        const nextProfile = await getUserById(profileUid);
        const isOwnProfile = authUser.uid === profileUid;
        const nextFriends =
          isOwnProfile && listMode !== 'mutual'
            ? await getFriendsForUser(profileUid)
            : await getMutualFriends({
                currentUid: authUser.uid,
                targetUid: profileUid,
              });

        setProfile(nextProfile);
        setFriends(nextFriends);
      } catch (loadError) {
        if (loadError instanceof FirebaseError) {
          setError(`No se pudieron cargar las amistades. Firebase: ${loadError.code}.`);
          return;
        }

        setError('No se pudieron cargar las amistades.');
      } finally {
        setIsLoading(false);
      }
    }

    loadFriends();
  }, [listMode, profileUid]);

  const isMutualMode = listMode === 'mutual';

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
          <Text style={styles.title}>
            {isMutualMode ? 'Amigos en comun' : 'Amistades'}
          </Text>
          <Text style={styles.subtitle}>
            {profile?.userName ? `@${profile.userName}` : 'Perfil'}
          </Text>
        </View>

        {isLoading ? <ActivityIndicator color="#20352b" style={styles.loader} /> : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {!isLoading && !error && friends.length === 0 ? (
          <Text style={styles.emptyText}>
            {isMutualMode ? 'No teneis amistades en comun.' : 'Todavia no tienes amistades.'}
          </Text>
        ) : null}

        <View style={styles.friendList}>
          {friends.map((friend) => (
            <Pressable
              key={friend.uid}
              style={({pressed}) => [styles.friendRow, pressed && styles.friendRowPressed]}
              onPress={() => router.push(`/Profile?uid=${encodeURIComponent(friend.uid)}`)}
            >
              <View style={styles.avatar}>
                <Image
                  source={
                    friend.profileImageUrl
                      ? {uri: friend.profileImageUrl}
                      : require('../assets/images/DefaultPorfilePicture.png')
                  }
                  resizeMode="cover"
                  style={styles.avatarImage}
                />
              </View>

              <View style={styles.friendCopy}>
                <UserNameWithDiagnosis
                  userName={friend.userName}
                  teaDiagnosis={friend.teaDiagnosis}
                  uid={friend.uid}
                  nameStyle={styles.friendName}
                />
                {friend.description ? (
                  <Text numberOfLines={1} style={styles.friendDescription}>
                    {friend.description}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          ))}
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
  },
  emptyText: {
    color: '#65736a',
    fontSize: 14,
    lineHeight: 20,
  },
  friendList: {
    gap: 10,
  },
  friendRow: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#dce3dd',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 12,
  },
  friendRowPressed: {
    opacity: 0.78,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: '#dce3dd',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 48,
  },
  avatarImage: {
    height: '100%',
    width: '100%',
  },
  friendCopy: {
    flex: 1,
  },
  friendName: {
    color: '#17211b',
    fontSize: 15,
    fontWeight: '800',
  },
  friendDescription: {
    color: '#65736a',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
  },
});
