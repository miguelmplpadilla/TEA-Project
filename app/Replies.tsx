import {FirebaseError} from 'firebase/app';
import {router} from 'expo-router';
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
    getFriendAcceptedNotificationsForUser,
    getPendingFriendRequestsForUser,
    getRepliesForUser,
    markFriendAcceptedNotificationsSeenForUser,
    markRepliesSeenForUser,
    type FriendAcceptedNotification,
    type FriendRequest,
    type PublicationReply,
} from '@/services/users';

export default function Replies() {
    const [replies, setReplies] = useState<PublicationReply[]>([]);
    const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
    const [friendNotifications, setFriendNotifications] = useState<FriendAcceptedNotification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        async function loadReplies() {
            const authUser = getFirebaseAuth().currentUser;

            if (!authUser) {
                setError('Necesitas iniciar sesion para ver tus respuestas.');
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError('');

            try {
                const [nextReplies, nextFriendRequests, nextFriendNotifications] = await Promise.all([
                    getRepliesForUser(authUser.uid),
                    getPendingFriendRequestsForUser(authUser.uid),
                    getFriendAcceptedNotificationsForUser(authUser.uid),
                ]);

                setReplies(nextReplies);
                setFriendRequests(nextFriendRequests);
                setFriendNotifications(nextFriendNotifications);
                await Promise.all([
                    markRepliesSeenForUser(authUser.uid),
                    markFriendAcceptedNotificationsSeenForUser(authUser.uid),
                ]);
            } catch (loadError) {
                if (loadError instanceof FirebaseError) {
                    setError(`No se pudieron cargar las respuestas. Firebase: ${loadError.code}.`);
                    return;
                }

                setError('No se pudieron cargar las respuestas.');
            } finally {
                setIsLoading(false);
            }
        }

        loadReplies();
    }, []);

    function openPublication(publicationId: string) {
        router.push({
            pathname: '/Post',
            params: {publicationId},
        });
    }

    function openFriendRequests() {
        router.push('/FriendRequests');
    }

    const friendRequestSummary =
        friendRequests.length > 0
            ? `${friendRequests[0].fromUserName}${friendRequests.length > 1 ? ` + ${friendRequests.length - 1} mas` : ''}`
            : '';

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
                    <Text style={styles.title}>Actividad</Text>
                    <Text style={styles.subtitle}>Respuestas, solicitudes y avisos de amistad.</Text>
                </View>

                {isLoading ? <ActivityIndicator color="#20352b" style={styles.loader} /> : null}
                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                {!isLoading && !error && friendRequests.length > 0 ? (
                    <Pressable
                        style={({pressed}) => [styles.requestSummary, pressed && styles.replyCardPressed]}
                        onPress={openFriendRequests}
                    >
                        <View style={styles.requestSummaryIcon}>
                            <Ionicons name="people" style={styles.requestSummaryIconText} />
                        </View>
                        <View style={styles.requestSummaryCopy}>
                            <Text style={styles.requestSummaryTitle}>Solicitudes de amistad</Text>
                            <Text style={styles.requestSummaryText}>{friendRequestSummary}</Text>
                        </View>
                        <Ionicons name="chevron-forward" style={styles.requestSummaryArrow} />
                    </Pressable>
                ) : null}

                {!isLoading && !error && replies.length === 0 && friendRequests.length === 0 && friendNotifications.length === 0 ? (
                    <Text style={styles.emptyText}>Todavia no tienes actividad.</Text>
                ) : null}

                <View style={styles.replyList}>
                    {friendNotifications.map((notification) => (
                        <Pressable
                            key={notification.id}
                            style={({pressed}) => [styles.replyCard, pressed && styles.replyCardPressed]}
                            onPress={() =>
                                router.push(`/Profile?uid=${encodeURIComponent(notification.fromUid)}`)
                            }
                        >
                            <View style={styles.replyMeta}>
                                <UserNameWithDiagnosis
                                    userName={notification.fromUserName}
                                    uid={notification.fromUid}
                                    size="small"
                                    nameStyle={styles.replyAuthor}
                                />
                                <Text style={styles.replyDate}>{formatDate(notification.createdAt)}</Text>
                            </View>
                            <Text style={styles.publicationTitle}>Solicitud aceptada</Text>
                            <Text style={styles.replyText}>
                                {notification.fromUserName} acepto tu solicitud de amistad.
                            </Text>
                        </Pressable>
                    ))}

                    {replies.map((reply) => (
                        <Pressable
                            key={`${reply.publicationId}-${reply.id}`}
                            style={({pressed}) => [styles.replyCard, pressed && styles.replyCardPressed]}
                            onPress={() => openPublication(reply.publicationId)}
                        >
                            <View style={styles.replyMeta}>
                                <UserNameWithDiagnosis
                                    userName={reply.userName}
                                    uid={reply.uid}
                                    size="small"
                                    nameStyle={styles.replyAuthor}
                                />
                                <Text style={styles.replyDate}>{formatDate(reply.createdAt)}</Text>
                            </View>

                            <Text style={styles.publicationTitle}>{reply.publicationTitle}</Text>
                            {reply.text ? <Text style={styles.replyText}>{reply.text}</Text> : null}

                            {reply.imagesUrls.length > 0 ? (
                                <View style={styles.imageList}>
                                    {reply.imagesUrls.map((image, index) => (
                                        <Image
                                            key={`${image}-${index}`}
                                            source={{uri: image}}
                                            resizeMode="cover"
                                            style={styles.replyImage}
                                        />
                                    ))}
                                </View>
                            ) : null}
                        </Pressable>
                    ))}
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
        flex: 1,
        backgroundColor: '#f4f6f3',
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
    requestSummary: {
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderColor: '#dce3dd',
        borderRadius: 8,
        borderWidth: 1,
        flexDirection: 'row',
        gap: 12,
        marginBottom: 14,
        padding: 12,
    },
    requestSummaryIcon: {
        alignItems: 'center',
        backgroundColor: '#20352b',
        borderRadius: 18,
        height: 36,
        justifyContent: 'center',
        width: 36,
    },
    requestSummaryIconText: {
        color: '#ffffff',
        fontSize: 18,
    },
    requestSummaryCopy: {
        flex: 1,
    },
    requestSummaryTitle: {
        color: '#111814',
        fontSize: 14,
        fontWeight: '800',
    },
    requestSummaryText: {
        color: '#526057',
        fontSize: 13,
        marginTop: 2,
    },
    requestSummaryArrow: {
        color: '#526057',
        fontSize: 20,
    },
    replyList: {
        gap: 10,
    },
    replyCard: {
        backgroundColor: '#ffffff',
        borderColor: '#dce3dd',
        borderRadius: 8,
        borderWidth: 1,
        padding: 14,
    },
    replyCardPressed: {
        opacity: 0.82,
    },
    replyMeta: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 8,
    },
    replyAuthor: {
        color: '#17211b',
        fontSize: 13,
        fontWeight: '800',
    },
    replyDate: {
        color: '#65736a',
        fontSize: 12,
    },
    publicationTitle: {
        color: '#111814',
        fontSize: 16,
        fontWeight: '800',
        lineHeight: 22,
    },
    replyText: {
        color: '#3d4a42',
        fontSize: 14,
        lineHeight: 21,
        marginTop: 8,
    },
    imageList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 10,
    },
    replyImage: {
        backgroundColor: '#dce3dd',
        borderRadius: 8,
        height: 74,
        width: 74,
    },
});
