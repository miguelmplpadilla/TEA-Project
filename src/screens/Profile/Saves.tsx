import {router} from 'expo-router';
import {useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, Image, Pressable, StyleSheet, Text, View} from 'react-native';

import {PostCard} from '@/components/PostCard';
import {UserNameWithDiagnosis} from '@/components/UserNameWithDiagnosis';
import {
    createSavedCommentId,
    getPublications,
    getUserById,
    type Publication,
    type PublicationComment,
} from '@/services/users';

type SavesProps = {
    uid: string;
};

type SavedComment = PublicationComment & {
    publicationId: string;
    publicationTitle: string;
};

export function Saves({uid}: SavesProps) {
    const [publications, setPublications] = useState<Publication[]>([]);
    const [savedPublicationIds, setSavedPublicationIds] = useState<string[]>([]);
    const [savedCommentIds, setSavedCommentIds] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        async function loadSaves() {
            if (!uid) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError('');

            try {
                const [profile, nextPublications] = await Promise.all([
                    getUserById(uid),
                    getPublications(),
                ]);

                setSavedPublicationIds(profile?.savedPublicationIds ?? []);
                setSavedCommentIds(profile?.savedCommentIds ?? []);
                setPublications(nextPublications);
            } catch {
                setError('No se pudieron cargar los guardados.');
            } finally {
                setIsLoading(false);
            }
        }

        loadSaves();
    }, [uid]);

    const savedPublications = useMemo(
        () => publications.filter((publication) => savedPublicationIds.includes(publication.id)),
        [publications, savedPublicationIds],
    );

    const savedComments = useMemo(() => {
        return publications
            .flatMap((publication) =>
                publication.comments
                    .filter((comment) =>
                        savedCommentIds.includes(createSavedCommentId(publication.id, comment.id)),
                    )
                    .map((comment): SavedComment => ({
                        ...comment,
                        publicationId: publication.id,
                        publicationTitle: publication.title,
                    })),
            )
            .sort((firstComment, secondComment) => {
                const firstTime = firstComment.createdAt?.getTime() ?? 0;
                const secondTime = secondComment.createdAt?.getTime() ?? 0;

                return secondTime - firstTime;
            });
    }, [publications, savedCommentIds]);

    function openPublication(publicationId: string) {
        router.push({
            pathname: '/Post',
            params: {publicationId},
        });
    }

    return (
        <View style={styles.content}>
            <View style={styles.header}>
                <Text style={styles.title}>Guardados</Text>
            </View>

            {isLoading ? <ActivityIndicator color="#20352b" style={styles.loader} /> : null}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {!isLoading && !error && savedPublications.length === 0 && savedComments.length === 0 ? (
                <Text style={styles.emptyText}>Todavia no hay guardados.</Text>
            ) : null}

            {savedPublications.length > 0 ? (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Publicaciones</Text>
                    {savedPublications.map((publication, index) => (
                        <View key={publication.id}>
                            <PostCard post={publication} />
                            {index < savedPublications.length - 1 && <View style={styles.separator} />}
                        </View>
                    ))}
                </View>
            ) : null}

            {savedComments.length > 0 ? (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Comentarios</Text>
                    {savedComments.map((comment, index) => (
                        <View key={`${comment.publicationId}-${comment.id}-${index}`}>
                            <Pressable
                                style={({pressed}) => [styles.commentCard, pressed && styles.commentCardPressed]}
                                onPress={() => openPublication(comment.publicationId)}
                            >
                                <Text style={styles.postTitle}>{comment.publicationTitle}</Text>
                                <UserNameWithDiagnosis
                                    userName={comment.userName}
                                    uid={comment.uid}
                                    size="small"
                                    nameStyle={styles.commentAuthor}
                                />
                                <Text style={styles.date}>{formatDate(comment.createdAt)}</Text>
                                {comment.text ? <Text style={styles.commentText}>{comment.text}</Text> : null}

                                {comment.imagesUrls.length > 0 ? (
                                    <View style={styles.imageList}>
                                        {comment.imagesUrls.map((image, imageIndex) => (
                                            <Image
                                                key={`${image}-${imageIndex}`}
                                                source={{uri: image}}
                                                resizeMode="cover"
                                                style={styles.commentImage}
                                            />
                                        ))}
                                    </View>
                                ) : null}
                            </Pressable>
                            {index < savedComments.length - 1 && <View style={styles.separator} />}
                        </View>
                    ))}
                </View>
            ) : null}
        </View>
    );
}

function formatDate(date: Date | null) {
    if (!date) {
        return '';
    }

    return date.toLocaleDateString();
}

const styles = StyleSheet.create({
    content: {
        padding: 16,
        paddingTop: 5,
        paddingBottom: 70,
    },
    header: {
        paddingBottom: 18,
    },
    title: {
        color: '#111814',
        fontSize: 28,
        fontWeight: '700',
        lineHeight: 34,
    },
    loader: {
        marginTop: 12,
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
    section: {
        marginTop: 4,
    },
    sectionTitle: {
        color: '#17211b',
        fontSize: 16,
        fontWeight: '800',
        marginBottom: 10,
        marginTop: 8,
    },
    commentCard: {
        backgroundColor: '#ffffff',
        borderColor: '#dce3dd',
        borderRadius: 8,
        borderWidth: 1,
        padding: 14,
    },
    commentCardPressed: {
        opacity: 0.82,
    },
    postTitle: {
        color: '#17211b',
        fontSize: 14,
        fontWeight: '800',
        marginBottom: 6,
    },
    commentAuthor: {
        color: '#17211b',
        fontSize: 13,
        fontWeight: '800',
    },
    date: {
        color: '#65736a',
        fontSize: 12,
        marginTop: 3,
    },
    commentText: {
        color: '#3d4a42',
        fontSize: 14,
        lineHeight: 21,
        marginTop: 10,
    },
    imageList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 10,
    },
    commentImage: {
        backgroundColor: '#dce3dd',
        borderRadius: 8,
        height: 74,
        width: 74,
    },
    separator: {
        height: 12,
    },
});
