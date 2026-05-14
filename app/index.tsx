import {FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';

import { PostCard } from '@/components/PostCard';
import type { Post } from '@/types/post';
import {FooterApp} from "@/components/Footer";
import { signOut } from 'firebase/auth';
import { getFirebaseAuth } from '@/services/firebase';

const posts: Post[] = [
  {
    id: '1',
    author: 'Laura Garcia',
    handle: '@laurag',
    createdAt: 'hace 12 min',
    title: 'Como organizais vuestras tareas cuando teneis varias entregas?',
    body: 'Estoy probando listas semanales, pero siento que pierdo contexto rapido. Me interesa saber que sistemas os funcionan en el dia a dia.',
    commentCount: 18,
    score: 42,
    tags: ['Productividad', 'Consejos']
  },
  {
    id: '2',
    author: 'Miguel Torres',
    handle: '@miguelt',
    createdAt: 'hace 34 min',
    title: 'Que stack usariais para una app social pequena?',
    body: 'Estoy montando una app tipo foro con publicaciones y respuestas. Busco algo sencillo para empezar, pero que no se quede corto pronto.',
    commentCount: 27,
    score: 61,
    tags: ['React Native', 'Backend']
  },
  {
    id: '3',
    author: 'Nadia Romero',
    handle: '@nadia',
    createdAt: 'hace 1 h',
    title: 'Como moderariais contenido sin crear comunidades?',
    body: 'Si todo vive en un feed unico, me preocupa como destacar buenas respuestas y evitar ruido sin complicar demasiado la experiencia.',
    commentCount: 9,
    score: 24,
    tags: ['Moderacion', 'UX']
  }
];

export default function Index() {
  async function logout() {
    await signOut(getFirebaseAuth());
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostCard post={item} />}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.eyebrow}>TEARS</Text>
            <Text style={styles.title}>Publicaciones recientes</Text>
            <Text style={styles.subtitle}>
              Preguntas, respuestas y conversaciones abiertas de la comunidad.
            </Text>
            <TouchableOpacity onPress={logout}>
              <Text>Cerrar sesión</Text>
            </TouchableOpacity>
          </View>
        }
      />
      <FooterApp/>
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
  registerButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#20352b',
    borderRadius: 8,
    justifyContent: 'center',
    marginTop: 16,
    minHeight: 44,
    paddingHorizontal: 16
  },
  registerButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800'
  },
  separator: {
    height: 12
  },
});
