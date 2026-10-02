import {
    Alert,
    SafeAreaView,
    StyleSheet,
    Image,
    ScrollView,
    View,
    Text,
    TouchableOpacity,
} from 'react-native';
import {FooterApp} from "@/components/Footer";
import {useEffect, useState} from 'react';
import {Ionicons} from "@expo/vector-icons";
import {Posts} from "@/screens/Profile/Posts";
import React, { useRef } from 'react';
import {Like} from "@/screens/Profile/Like";
import {Comments} from "@/screens/Profile/Comments";
import {Saves} from "@/screens/Profile/Saves";
import {type UserProfile} from '@/services/users';
import {onAuthStateChanged} from "firebase/auth";
import {getFirebaseAuth, getFirebaseFirestore} from "@/services/firebase";
import {doc, getDoc} from "firebase/firestore";
import LikeEdit, {LikeEditFooter, type LikeEditHandle} from './LikeEdit';
import * as ImagePicker from 'expo-image-picker';
import {router, useLocalSearchParams, type Href} from 'expo-router';
import {OptionsMenu} from '@/components/OptionsMenu';
import {ReportDialog} from '@/components/ReportDialog';
import {UserNameWithDiagnosis} from '@/components/UserNameWithDiagnosis';
import {getTeaDiagnosisLabel} from '@/constants/teaDiagnosis';
import {
    getFriendsForUser,
    getFriendshipStatus,
    getMutualFriends,
    sendFriendRequest,
    type FriendshipStatus,
} from '@/services/users';

export default function Profile() {
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [userName, setUserName] = useState("");
    const [likeEditIsSaving, setLikeEditIsSaving] = useState(false);
    const [reportVisible, setReportVisible] = useState(false);
    const [friendshipStatus, setFriendshipStatus] = useState<FriendshipStatus>('none');
    const [friends, setFriends] = useState<UserProfile[]>([]);
    const [mutualFriends, setMutualFriends] = useState<UserProfile[]>([]);
    const [isFriendActionLoading, setIsFriendActionLoading] = useState(false);

    const scrollRef = useRef<ScrollView>(null);
    const likeEditRef = useRef<LikeEditHandle>(null);
    const [activeSection, setActiveSection] = useState('like')
    const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
    const [profileBackgroundUri, setProfileBackgroundUri] = useState<string | null>(null);

    const [isSameUser, setIsSameUser] = useState(false)
    const {uid} = useLocalSearchParams<{uid?: string | string[]}>();
    const routeUid = Array.isArray(uid) ? uid[0] : uid;
    const shouldShowFriendAction =
        !isSameUser &&
        userProfile !== null &&
        friendshipStatus !== 'self';

    function SetActiveSession(value: string) {
        setActiveSection(value)
        scrollRef.current?.scrollTo({
            y: 0,
            animated: true,
        });
    }

    useEffect(() => {
        function resetProfileState() {
            setUserProfile(null);
            setFriendshipStatus('none');
            setFriends([]);
            setMutualFriends([]);
        }

        const unsubscribe = onAuthStateChanged(getFirebaseAuth(), async (authUser) => {
            if (!authUser) {
                resetProfileState();
                return;
            }

            const targetUid = routeUid ?? authUser.uid;
            const userRef = doc(getFirebaseFirestore(), 'users', targetUid);
            const userSnapshot = await getDoc(userRef);

            setIsSameUser(targetUid === authUser.uid);

            if (userSnapshot.exists()) {
                const profile = userSnapshot.data() as UserProfile;

                setUserProfile(profile);
                setUserName(profile.userName);
                setProfileImageUri(profile.profileImageUrl ?? null);
                setProfileBackgroundUri(profile.profileBackgroundUrl ?? null);

                if (targetUid !== authUser.uid) {
                    const [nextFriendshipStatus, nextMutualFriends] = await Promise.all([
                        getFriendshipStatus({
                            currentUid: authUser.uid,
                            targetUid,
                        }),
                        getMutualFriends({
                            currentUid: authUser.uid,
                            targetUid,
                        }),
                    ]);

                    setFriendshipStatus(nextFriendshipStatus);
                    setFriends([]);
                    setMutualFriends(nextMutualFriends);
                } else {
                    const nextFriends = await getFriendsForUser(authUser.uid);

                    setFriendshipStatus('self');
                    setFriends(nextFriends);
                    setMutualFriends([]);
                }
            } else {
                resetProfileState();
            }
        });

        return unsubscribe;
    }, [routeUid]);

    function handleEditProfileBackground() {
        void pickImage(setProfileBackgroundUri);
    }

    function handleEditProfileImage() {
        void pickImage(setProfileImageUri);
    }

    async function pickImage(onPicked: (uri: string) => void) {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
            Alert.alert('Permiso necesario', 'Necesitas permitir acceso a tus fotos.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled) {
            onPicked(result.assets[0].uri);
        }
    }

    async function handleFriendActionPress() {
        const authUser = getFirebaseAuth().currentUser;

        if (!authUser || !userProfile || isFriendActionLoading) {
            return;
        }

        if (friendshipStatus === 'incoming_pending') {
            router.push('/FriendRequests' as Href);
            return;
        }

        if (friendshipStatus !== 'none') {
            return;
        }

        setIsFriendActionLoading(true);

        try {
            await sendFriendRequest({
                fromUid: authUser.uid,
                toUid: userProfile.uid,
            });
            setFriendshipStatus('outgoing_pending');
        } catch (error) {
            Alert.alert(
                'No se pudo enviar',
                error instanceof Error ? error.message : 'No se pudo enviar la solicitud.',
            );
        } finally {
            setIsFriendActionLoading(false);
        }
    }

    function getFriendActionCopy() {
        switch (friendshipStatus) {
            case 'friends':
                return 'Amigos';
            case 'outgoing_pending':
                return 'Pendiente de confirmacion';
            case 'incoming_pending':
                return 'Responder solicitud';
            default:
                return 'Enviar solicitud';
        }
    }

    function getFriendActionIcon() {
        switch (friendshipStatus) {
            case 'friends':
            case 'outgoing_pending':
                return 'checkmark-circle';
            case 'incoming_pending':
                return 'mail-unread';
            default:
                return 'person-add';
        }
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                ref={scrollRef}
            >
                <View
                    style={[styles.profileBackground,
                        !profileBackgroundUri && { backgroundColor: '#bababa'},]}
                >
                    {profileBackgroundUri && (
                        <Image
                            source={{ uri: profileBackgroundUri }}
                            style={styles.profileBackgroundImage}
                        />
                    )}
                    {activeSection !== 'likeEdit' && isSameUser && (
                        <TouchableOpacity style={styles.editButton}
                                          onPress={() => SetActiveSession('likeEdit')}>
                            <Ionicons name="pencil" style={styles.editButtonIcon}></Ionicons>
                        </TouchableOpacity>
                    )}
                    {activeSection !== 'likeEdit' && !isSameUser && userProfile ? (
                        <OptionsMenu
                            accessibilityLabel="Opciones del perfil"
                            triggerStyle={styles.editButton}
                            iconStyle={styles.editButtonIcon}
                            actions={[
                                {
                                    id: 'report-profile',
                                    label: 'Reportar perfil',
                                    icon: 'flag-outline',
                                    tone: 'danger',
                                    onPress: () => setReportVisible(true),
                                },
                            ]}
                        />
                    ) : null}
                    {activeSection === 'likeEdit' && (
                        <TouchableOpacity
                            activeOpacity={0.82}
                            style={styles.backgroundEditButton}
                            onPress={handleEditProfileBackground}
                        >
                            <Ionicons name="image" style={styles.editButtonIcon}></Ionicons>
                        </TouchableOpacity>
                    )}
                    <View style={styles.profileImageWrap}>
                        <Image
                            source={
                                profileImageUri
                                    ? { uri: profileImageUri }
                                    : require('../assets/images/DefaultPorfilePicture.png')
                            }
                            style={styles.profileImage}
                        />
                        {activeSection === 'likeEdit' && (
                            <TouchableOpacity
                                activeOpacity={0.82}
                                style={styles.profileImageEditButton}
                                onPress={handleEditProfileImage}
                            >
                                <Ionicons name="pencil" style={styles.profileImageEditIcon}></Ionicons>
                            </TouchableOpacity>
                        )}
                    </View>
                    <View style={styles.userNameBadge}>
                        <UserNameWithDiagnosis
                            userName={userName}
                            teaDiagnosis={userProfile?.teaDiagnosis}
                            size="large"
                            nameStyle={styles.userName}
                        />
                    </View>
                    {userProfile ? (
                        <Text style={styles.diagnosisText}>
                            {getTeaDiagnosisLabel(userProfile.teaDiagnosis)}
                        </Text>
                    ) : null}
                    {userProfile?.psychologistVerificationStatus === 'verified' ? (
                        <View style={styles.psychologistBadge}>
                            <Ionicons name="checkmark-circle" style={styles.psychologistBadgeIcon}></Ionicons>
                            <Text style={styles.psychologistBadgeText}>Psicologa verificada</Text>
                        </View>
                    ) : null}
                </View>

                {shouldShowFriendAction ? (
                    <View style={styles.ownerActions}>
                        <TouchableOpacity
                            activeOpacity={0.82}
                            disabled={isFriendActionLoading || friendshipStatus === 'friends' || friendshipStatus === 'outgoing_pending'}
                            style={[
                                styles.verificationButton,
                                (friendshipStatus === 'friends' || friendshipStatus === 'outgoing_pending') &&
                                    styles.disabledActionButton,
                            ]}
                            onPress={handleFriendActionPress}
                        >
                            <Ionicons name={getFriendActionIcon()} style={styles.verificationButtonIcon}></Ionicons>
                            <Text style={styles.verificationButtonText}>{getFriendActionCopy()}</Text>
                        </TouchableOpacity>

                        <FriendCountButton
                            count={mutualFriends.length}
                            label="en comun"
                            onPress={() =>
                                router.push({
                                    pathname: '/Friends',
                                    params: {uid: userProfile.uid, mode: 'mutual'},
                                })
                            }
                        />
                    </View>
                ) : null}

                {isSameUser && userProfile ? (
                    <View style={styles.ownerActions}>
                        <FriendCountButton
                            count={friends.length}
                            label="amistades"
                            onPress={() =>
                                router.push({
                                    pathname: '/Friends',
                                    params: {uid: userProfile.uid, mode: 'all'},
                                })
                            }
                        />
                    </View>
                ) : null}

                <View style={styles.navBar}>
                    <TouchableOpacity style={styles.navBarButton}
                                      onPress={() => SetActiveSession('like')}>
                        <Image source={require('../assets/images/TEA-Icon.png')}
                               style={styles.navBarButtonImage}></Image>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.navBarButton}
                                      onPress={() => SetActiveSession('posts')}>
                        <Ionicons name="apps" style={styles.navBarButtonText}></Ionicons>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.navBarButton}
                                      onPress={() => SetActiveSession('comments')}>
                        <Ionicons name="chatbubble" style={styles.navBarButtonText}></Ionicons>
                    </TouchableOpacity>

                    {isSameUser && (
                        <TouchableOpacity style={styles.navBarButton}
                                          onPress={() => SetActiveSession('saves')}>
                            <Ionicons name="bookmark" style={styles.navBarButtonText}></Ionicons>
                        </TouchableOpacity>
                    )}
                </View>

                {activeSection === 'like' && (
                    <Like/>
                )}

                {activeSection === 'likeEdit' && (
                    <LikeEdit
                        ref={likeEditRef}
                        profileImageUri={profileImageUri}
                        profileBackgroundUri={profileBackgroundUri}
                        onImagesUploaded={({profileImageUrl, profileBackgroundUrl}) => {
                            setProfileImageUri(profileImageUrl);
                            setProfileBackgroundUri(profileBackgroundUrl);
                        }}
                        onSaved={() => SetActiveSession('like')}
                        onStateChange={({isSaving}) => setLikeEditIsSaving(isSaving)}
                    />
                )}

                {activeSection === 'posts' && (
                    <Posts userName={userName} teaDiagnosis={userProfile?.teaDiagnosis}/>
                )}

                {activeSection === 'comments' && (
                    <Comments
                        uid={userProfile?.uid ?? ''}
                        userName={userName}
                        teaDiagnosis={userProfile?.teaDiagnosis}
                    />
                )}

                {activeSection === 'saves' && (
                    <Saves uid={userProfile?.uid ?? ''}/>
                )}
            </ScrollView>

            <ReportDialog
                visible={reportVisible}
                targetType="profile"
                targetId={userProfile?.uid ?? ''}
                targetOwnerUid={userProfile?.uid}
                onClose={() => setReportVisible(false)}
            />

            {activeSection === 'likeEdit' ? (
                <LikeEditFooter
                    isSaving={likeEditIsSaving}
                    onCancel={() => SetActiveSession('like')}
                    onSave={() => likeEditRef.current?.save()}
                />
            ) : (
                <FooterApp/>
            )}
        </SafeAreaView>
    );
}

function FriendCountButton({
    count,
    label,
    onPress,
}: {
    count: number;
    label: string;
    onPress: () => void;
}) {
    return (
        <TouchableOpacity
            activeOpacity={0.78}
            style={styles.friendCountButton}
            onPress={onPress}
        >
            <Text style={styles.friendCountNumber}>{count}</Text>
            <Text style={styles.friendCountLabel}>{label}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        backgroundColor: '#f4f6f3',
    },
    profileBackground: {
        width: '100%',
        height: 220,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative'
    },
    profileBackgroundImage: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        width: '100%',
        height: '100%'
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#a5a5a5'
    },
    profileImageWrap: {
        position: 'relative',
        width: 120,
        height: 120,
    },
    backgroundEditButton: {
        position: 'absolute',
        right: 16,
        top: 16,
        width: 40,
        height: 40,
        borderRadius: 8,
        alignItems: 'center',
        backgroundColor: '#444',
        justifyContent: 'center',
        zIndex: 1,
    },
    profileImageEditButton: {
        position: 'absolute',
        right: 0,
        bottom: 0,
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        backgroundColor: '#444',
        borderColor: '#bababa',
        borderWidth: 2,
        justifyContent: 'center',
    },
    profileImageEditIcon: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    userName: {
        color: '#17211b',
        fontSize: 20,
        fontWeight: '700',
    },
    userNameBadge: {
        alignItems: 'center',
        backgroundColor: '#dddddd',
        borderRadius: 5,
        marginTop: 5,
        paddingHorizontal: 5,
        paddingVertical: 2.5,
    },
    diagnosisText: {
        backgroundColor: '#eeeeee',
        borderRadius: 5,
        color: '#405348',
        fontSize: 12,
        fontWeight: '700',
        marginTop: 5,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    psychologistBadge: {
        alignItems: 'center',
        backgroundColor: '#d9f0e2',
        borderRadius: 5,
        flexDirection: 'row',
        gap: 4,
        marginTop: 5,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    psychologistBadgeIcon: {
        color: '#1e6a45',
        fontSize: 13,
    },
    psychologistBadgeText: {
        color: '#1e6a45',
        fontSize: 12,
        fontWeight: '700',
    },
    ownerActions: {
        backgroundColor: '#f4f6f3',
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    verificationButton: {
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: '#ffffff',
        borderColor: '#dce3dd',
        borderRadius: 8,
        borderWidth: 1,
        flexDirection: 'row',
        gap: 7,
        minHeight: 38,
        paddingHorizontal: 12,
    },
    verificationButtonIcon: {
        color: '#20352b',
        fontSize: 17,
    },
    verificationButtonText: {
        color: '#20352b',
        fontSize: 13,
        fontWeight: '800',
    },
    disabledActionButton: {
        opacity: 0.65,
    },
    friendCountButton: {
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderColor: '#dce3dd',
        borderRadius: 8,
        borderWidth: 1,
        justifyContent: 'center',
        minHeight: 54,
        minWidth: 96,
        paddingHorizontal: 14,
        paddingVertical: 8,
    },
    friendCountNumber: {
        color: '#111814',
        fontSize: 18,
        fontWeight: '800',
    },
    friendCountLabel: {
        color: '#526057',
        fontSize: 13,
        fontWeight: '700',
        marginTop: 2,
    },
    editButton: {
        position: 'absolute',
        right: 16,
        top: 16,
        width: 40,
        height: 40,
        borderRadius: 8,
        alignItems: 'center',
        backgroundColor: '#444',
        justifyContent: 'center',
        zIndex: 1,
    },
    editButtonIcon: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    navBar: {
        height: 40,
        backgroundColor: '#9a9a9a',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 3
    },

    navBarButton: {
        flex: 1,
        height: '100%',
        marginHorizontal: 4,
        borderRadius: 8,
        alignItems: 'center',
        backgroundColor: '#444',
        justifyContent: 'center',
    },

    navBarButtonText: {
        color: 'white',
        fontWeight: 'bold',
        tintColor: 'white',
        textAlign: 'center',
        fontSize: 20
    },

    navBarButtonImage: {
        textAlign: 'center',
        height: '60%',
        width: '60%'
    },

    sectionContent: {
        padding: 16,
        backgroundColor: '#f4f6f3',
    },
});
