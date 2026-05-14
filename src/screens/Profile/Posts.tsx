import {StyleSheet, Text, View} from 'react-native';
import {PostCard} from "@/components/PostCard";
import type {Post} from "@/types/post";

export function Posts() {

    const posts: Post[] = [
        {
            id: '1',
            author: 'Miguel Padilla',
            handle: '@miguelp',
            createdAt: 'hace 12 min',
            title: 'Como organizais vuestras tareas cuando teneis varias entregas?',
            body: 'Estoy probando listas semanales, pero siento que pierdo contexto rapido. Me interesa saber que sistemas os funcionan en el dia a dia.',
            commentCount: 18,
            score: 42,
            tags: ['Productividad', 'Consejos']
        },
        {
            id: '2',
            author: 'Miguel Padilla',
            handle: '@miguelp',
            createdAt: 'hace 34 min',
            title: 'Que stack usariais para una app social pequena?',
            body: 'Estoy montando una app tipo foro con publicaciones y respuestas. Busco algo sencillo para empezar, pero que no se quede corto pronto.',
            commentCount: 27,
            score: 61,
            tags: ['React Native', 'Backend']
        },
        {
            id: '3',
            author: 'Miguel Padilla',
            handle: '@miguelp',
            createdAt: 'hace 1 h',
            title: 'Como moderariais contenido sin crear comunidades?',
            body: 'Si todo vive en un feed unico, me preocupa como destacar buenas respuestas y evitar ruido sin complicar demasiado la experiencia.',
            commentCount: 9,
            score: 24,
            tags: ['Moderacion', 'UX']
        }
    ];

    return (
        <View style={styles.listContent}>
            <View style={styles.header}>
                <Text style={styles.title}>Tus publicaciones</Text>
            </View>

            {posts.map((post, index) => (
                <View key={post.id}>
                    <PostCard post={post} />
                    {index < posts.length - 1 && <View style={styles.separator} />}
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    listContent: {
        padding: 16,
        paddingTop: 5,
        paddingBottom: 70
    },
    header: {
        paddingBottom: 18
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
    separator: {
        height: 12
    },
});
