import {FirebaseError} from 'firebase/app';
import {signOut} from 'firebase/auth';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  PanResponder,
  Platform,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {FooterApp} from '@/components/Footer';
import {PostCard} from '@/components/PostCard';
import {getFirebaseAuth} from '@/services/firebase';
import {getPublications, type Publication} from '@/services/users';

export default function Index() {
  const [posts, setPosts] = useState<Publication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [error, setError] = useState('');
  const scrollYRef = useRef(0);

  const loadPosts = useCallback(async ({refreshing = false}: {refreshing?: boolean} = {}) => {
    if (refreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setError('');

    try {
      const publications = await getPublications();
      setPosts(publications);
    } catch (loadError) {
      if (loadError instanceof FirebaseError) {
        setError(`No se pudieron cargar las publicaciones. Firebase: ${loadError.code}.`);
        return;
      }

      setError('No se pudieron cargar las publicaciones.');
    } finally {
      if (refreshing) {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const refreshPosts = useCallback(() => {
    if (!isRefreshing && !isLoading) {
      loadPosts({refreshing: true});
    }
  }, [isLoading, isRefreshing, loadPosts]);

  const webPullResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Platform.OS === 'web' &&
          scrollYRef.current <= 0 &&
          gestureState.dy > 14 &&
          Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
        onPanResponderMove: (_, gestureState) => {
          if (gestureState.dy > 0) {
            setPullDistance(Math.min(gestureState.dy, 96));
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dy >= 64) {
            refreshPosts();
          }

          setPullDistance(0);
        },
        onPanResponderTerminate: () => setPullDistance(0),
      }),
    [refreshPosts],
  );

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    scrollYRef.current = event.nativeEvent.contentOffset.y;
  }

  async function logout() {
    await signOut(getFirebaseAuth());
  }

  return (
    <SafeAreaView style={styles.safeArea} {...webPullResponder.panHandlers}>
      {Platform.OS === 'web' && pullDistance > 0 ? (
        <View style={[styles.webPullIndicator, {height: pullDistance}]}>
          {pullDistance >= 64 ? (
            <Text style={styles.webPullText}>Suelta para actualizar</Text>
          ) : (
            <Text style={styles.webPullText}>Desliza para actualizar</Text>
          )}
        </View>
      ) : null}
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({item}) => <PostCard post={item} />}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        alwaysBounceVertical
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          Platform.OS !== 'web' ? (
            <RefreshControl refreshing={isRefreshing} onRefresh={refreshPosts} />
          ) : undefined
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.eyebrow}>TEARS</Text>
            <Text style={styles.title}>Publicaciones recientes</Text>
            <Text style={styles.subtitle}>
              Preguntas, respuestas y conversaciones abiertas de la comunidad.
            </Text>
            <TouchableOpacity onPress={logout}>
              <Text>Cerrar sesion</Text>
            </TouchableOpacity>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {isLoading ? <ActivityIndicator color="#20352b" style={styles.loader} /> : null}
          </View>
        }
        ListEmptyComponent={
          !isLoading && !error ? (
            <Text style={styles.emptyText}>Todavia no hay publicaciones.</Text>
          ) : null
        }
      />
      <FooterApp />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f6f3'
  },
  listContent: {
    padding: 16,
    paddingBottom: 32
  },
  header: {
    paddingBottom: 18,
    paddingTop: 12
  },
  eyebrow: {
    color: '#526057',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0,
    marginBottom: 8
  },
  title: {
    color: '#111814',
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34
  },
  subtitle: {
    color: '#526057',
    fontSize: 16,
    lineHeight: 23,
    marginTop: 8
  },
  separator: {
    height: 12
  },
  loader: {
    marginTop: 16
  },
  errorText: {
    color: '#a33b30',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12
  },
  emptyText: {
    color: '#65736a',
    fontSize: 14,
    lineHeight: 20
  },
  webPullIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  webPullText: {
    color: '#526057',
    fontSize: 13,
    fontWeight: '700',
  },
});
