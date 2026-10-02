import {FirebaseError} from 'firebase/app';
import {router, useLocalSearchParams} from 'expo-router';
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
    ActivityIndicator,
    Image,
    Modal,
    NativeScrollEvent,
    NativeSyntheticEvent,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';

import {FooterApp} from '@/components/Footer';
import {OptionsMenu} from '@/components/OptionsMenu';
import {ReportDialog} from '@/components/ReportDialog';
import {UserNameWithDiagnosis} from '@/components/UserNameWithDiagnosis';
import {MAX_PUBLICATION_IMAGES} from '@/constants/publications';
import {uploadOptionalImageToCloudinary} from '@/services/cloudinary';
import {getFirebaseAuth} from '@/services/firebase';
import {
    addCommentToPublication,
    createSavedCommentId,
    getPublicationById,
    getUserById,
    removeSavedCommentForUser,
    removeSavedPublicationForUser,
    saveCommentForUser,
    savePublicationForUser,
    type Publication,
    type PublicationComment,
    type UserProfile,
} from '@/services/users';
import {pickImage} from './Onboarding';

export default function Post() {
    const {publicationId} = useLocalSearchParams<{publicationId?: string | string[]}>();
    const cleanPublicationId = Array.isArray(publicationId) ? publicationId[0] : publicationId;
    const [publication, setPublication] = useState<Publication | null>(null);
    const [authorName, setAuthorName] = useState('Usuario');
    const [authorProfile, setAuthorProfile] = useState<UserProfile | null>(null);
    const [comment, setComment] = useState('');
    const [commentImages, setCommentImages] = useState<string[]>([]);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isCommenting, setIsCommenting] = useState(false);
    const [isSavingPublication, setIsSavingPublication] = useState(false);
    const [savingCommentIds, setSavingCommentIds] = useState<string[]>([]);
    const [savedPublicationIds, setSavedPublicationIds] = useState<string[]>([]);
    const [savedCommentIds, setSavedCommentIds] = useState<string[]>([]);
    const [viewerVisible, setViewerVisible] = useState(false);
    const [viewerImages, setViewerImages] = useState<string[]>([]);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [reportVisible, setReportVisible] = useState(false);

    const comments = useMemo(
        () =>
            [...(publication?.comments ?? [])].sort((firstComment, secondComment) => {
                const firstTime = firstComment.createdAt?.getTime() ?? 0;
                const secondTime = secondComment.createdAt?.getTime() ?? 0;

                return firstTime - secondTime;
            }),
        [publication?.comments],
    );

    useEffect(() => {
        async function loadPublication() {
            if (!cleanPublicationId) {
                setError('No se encontro la publicacion.');
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError('');

            try {
                const nextPublication = await getPublicationById(cleanPublicationId);

                if (!nextPublication) {
                    setPublication(null);
                    setError('No se encontro la publicacion.');
                    return;
                }

                setPublication(nextPublication);

                const user = await getUserById(nextPublication.uid);
                setAuthorProfile(user);
                setAuthorName(user?.userName ?? 'Usuario eliminado');

                const authUser = getFirebaseAuth().currentUser;
                if (authUser) {
                    const currentUserProfile = await getUserById(authUser.uid);
                    setSavedPublicationIds(currentUserProfile?.savedPublicationIds ?? []);
                    setSavedCommentIds(currentUserProfile?.savedCommentIds ?? []);
                }
            } catch (loadError) {
                if (loadError instanceof FirebaseError) {
                    setError(`No se pudo cargar la publicacion. Firebase: ${loadError.code}.`);
                    return;
                }

                setError('No se pudo cargar la publicacion.');
            } finally {
                setIsLoading(false);
            }
        }

        loadPublication();
    }, [cleanPublicationId]);

    async function saveComment() {
        const authUser = getFirebaseAuth().currentUser;
        const cleanComment = comment.trim();

        if (!authUser) {
            setError('Necesitas iniciar sesion para comentar.');
            return;
        }

        if (!publication || !cleanPublicationId) {
            setError('No se encontro la publicacion.');
            return;
        }

        if (!cleanComment && commentImages.length === 0) {
            setError('Escribe un comentario o anade una imagen antes de enviarlo.');
            return;
        }

        if (commentImages.length > MAX_PUBLICATION_IMAGES) {
            setError(`Solo puedes comentar hasta ${MAX_PUBLICATION_IMAGES} imagenes.`);
            return;
        }

        setIsCommenting(true);
        setError('');

        try {
            const currentUserProfile = await getUserById(authUser.uid);
            const uploadStartedAt = Date.now();
            const uploadedUrls = await Promise.all(
                commentImages.map((image, index) =>
                    uploadOptionalImageToCloudinary(
                        image,
                        `comment-${authUser.uid}-${uploadStartedAt}-${index}`,
                    )
                )
            );
            const imageUrls = uploadedUrls.filter((url): url is string => url !== null);
            const newComment = await addCommentToPublication({
                publicationId: cleanPublicationId,
                uid: authUser.uid,
                userName: currentUserProfile?.userName ?? authUser.email?.split('@')[0] ?? 'Usuario',
                text: cleanComment,
                imagesUrls: imageUrls,
            });

            setPublication({
                ...publication,
                comments: [...publication.comments, newComment],
            });
            setComment('');
            setCommentImages([]);
        } catch (commentError) {
            if (commentError instanceof FirebaseError) {
                setError(`No se pudo comentar. Firebase: ${commentError.code}.`);
                return;
            }

            setError('No se pudo comentar.');
        } finally {
            setIsCommenting(false);
        }
    }

    function openImageViewer(index: number) {
        openImagesViewer(publication?.imagesUrls ?? [], index);
    }

    function openImagesViewer(images: string[], index: number) {
        if (images.length === 0) {
            return;
        }

        setViewerImages(images);
        setSelectedImageIndex(index);
        setViewerVisible(true);
    }

    function addCommentImage(uri: string) {
        setCommentImages((currentImages) => {
            if (currentImages.length >= MAX_PUBLICATION_IMAGES) {
                setError(`Solo puedes comentar hasta ${MAX_PUBLICATION_IMAGES} imagenes.`);
                return currentImages;
            }

            setError('');
            return [...currentImages, uri];
        });
    }

    function removeCommentImage(indexToRemove: number) {
        setCommentImages((currentImages) => currentImages.filter((_, index) => index !== indexToRemove));
    }

    async function toggleSavePublication() {
        const authUser = getFirebaseAuth().currentUser;

        if (!authUser || !publication || isSavingPublication) {
            setError('Necesitas iniciar sesion para guardar.');
            return;
        }

        setIsSavingPublication(true);
        setError('');

        try {
            if (savedPublicationIds.includes(publication.id)) {
                await removeSavedPublicationForUser(authUser.uid, publication.id);
                setSavedPublicationIds((currentIds) => currentIds.filter((id) => id !== publication.id));
            } else {
                await savePublicationForUser(authUser.uid, publication.id);
                setSavedPublicationIds((currentIds) => [...currentIds, publication.id]);
            }
        } catch {
            setError('No se pudo actualizar guardados.');
        } finally {
            setIsSavingPublication(false);
        }
    }

    async function toggleSaveComment(commentId: string) {
        const authUser = getFirebaseAuth().currentUser;

        if (!authUser || !publication) {
            setError('Necesitas iniciar sesion para guardar.');
            return;
        }

        if (savingCommentIds.includes(commentId)) {
            return;
        }

        const savedCommentId = createSavedCommentId(publication.id, commentId);
        setSavingCommentIds((currentIds) => [...currentIds, commentId]);
        setError('');

        try {
            if (savedCommentIds.includes(savedCommentId)) {
                await removeSavedCommentForUser(authUser.uid, publication.id, commentId);
                setSavedCommentIds((currentIds) => currentIds.filter((id) => id !== savedCommentId));
            } else {
                await saveCommentForUser(authUser.uid, publication.id, commentId);
                setSavedCommentIds((currentIds) => [...currentIds, savedCommentId]);
            }
        } catch {
            setError('No se pudo actualizar guardados.');
        } finally {
            setSavingCommentIds((currentIds) => currentIds.filter((id) => id !== commentId));
        }
    }

    function handleOpenProfile() {
        if (!publication?.uid) {
            return;
        }

        router.navigate(`/Profile?uid=${encodeURIComponent(publication.uid)}`);
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.actions}>
                    <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" style={styles.iconButtonText} />
                    </TouchableOpacity>
                    {publication ? (
                        <TouchableOpacity
                            style={[styles.iconButton, isSavingPublication && styles.disabledButton]}
                            disabled={isSavingPublication}
                            onPress={toggleSavePublication}
                        >
                            <Ionicons
                                name={savedPublicationIds.includes(publication.id) ? 'bookmark' : 'bookmark-outline'}
                                style={styles.iconButtonText}
                            />
                        </TouchableOpacity>
                    ) : null}
                    {publication ? (
                        <OptionsMenu
                            accessibilityLabel="Opciones de publicacion"
                            triggerStyle={styles.iconButton}
                            iconStyle={styles.iconButtonText}
                            actions={[
                                {
                                    id: 'report-publication',
                                    label: 'Reportar publicacion',
                                    icon: 'flag-outline',
                                    tone: 'danger',
                                    onPress: () => setReportVisible(true),
                                },
                            ]}
                        />
                    ) : null}
                </View>

                {isLoading ? (
                    <View style={styles.loading}>
                        <ActivityIndicator color="#20352b" />
                    </View>
                ) : null}

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                {publication ? (
                    <>
                        <TouchableOpacity
                            activeOpacity={0.78}
                            style={styles.postHeader}
                            onPress={handleOpenProfile}
                        >
                            <Image
                                source={
                                    authorProfile?.profileImageUrl
                                        ? {uri: authorProfile.profileImageUrl}
                                        : require('../assets/images/DefaultPorfilePicture.png')
                                }
                                resizeMode="cover"
                                style={styles.authorAvatar}
                            />
                            <View style={styles.authorInfo}>
                                <UserNameWithDiagnosis
                                    userName={authorName}
                                    teaDiagnosis={authorProfile?.teaDiagnosis}
                                    uid={publication.uid}
                                    nameStyle={styles.author}
                                />
                                <Text style={styles.date}>{formatDate(publication.createdAt)}</Text>
                            </View>
                        </TouchableOpacity>

                        <Text style={styles.title}>{publication.title}</Text>
                        <Text style={styles.description}>{publication.description}</Text>

                        {publication.imagesUrls.length > 0 ? (
                            <PostImageCarousel
                                images={publication.imagesUrls}
                                onOpenImage={openImageViewer}
                            />
                        ) : null}

                        <View style={styles.tags}>
                            {publication.interests.map((interest) => (
                                <View key={interest} style={styles.tag}>
                                    <Text style={styles.tagText}>{interest}</Text>
                                </View>
                            ))}
                        </View>

                        <View style={styles.commentsHeader}>
                            <Text style={styles.commentsTitle}>Comentarios</Text>
                            <Text style={styles.commentsCount}>{comments.length}</Text>
                        </View>

                        <View style={styles.commentComposer}>
                            <TextInput
                                style={styles.commentInput}
                                placeholder="Escribe un comentario"
                                value={comment}
                                onChangeText={setComment}
                                multiline
                            />
                            <View style={styles.commentImageRow}>
                                <TouchableOpacity
                                    style={[
                                        styles.commentImageButton,
                                        commentImages.length >= MAX_PUBLICATION_IMAGES && styles.disabledButton,
                                    ]}
                                    disabled={isCommenting || commentImages.length >= MAX_PUBLICATION_IMAGES}
                                    onPress={() => pickImage(addCommentImage)}
                                >
                                    <Ionicons name="image" style={styles.commentImageButtonIcon} />
                                </TouchableOpacity>

                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={styles.commentImagePreviewList}
                                >
                                    {commentImages.map((image, index) => (
                                        <View key={`${image}-${index}`} style={styles.commentImagePreviewWrap}>
                                            <Image
                                                source={{uri: image}}
                                                resizeMode="cover"
                                                style={styles.commentImagePreview}
                                            />
                                            <TouchableOpacity
                                                style={styles.removeImageButton}
                                                onPress={() => removeCommentImage(index)}
                                            >
                                                <Ionicons name="close" style={styles.removeImageIcon} />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </ScrollView>
                            </View>
                            <TouchableOpacity
                                style={[styles.commentButton, isCommenting && styles.disabledButton]}
                                disabled={isCommenting}
                                onPress={saveComment}
                            >
                                {isCommenting ? (
                                    <ActivityIndicator color="#ffffff" />
                                ) : (
                                    <Text style={styles.commentButtonText}>Comentar</Text>
                                )}
                            </TouchableOpacity>
                        </View>

                        <View style={styles.commentList}>
                            {comments.map((publicationComment) => (
                                <CommentItem
                                    key={publicationComment.id}
                                    comment={publicationComment}
                                    isSaved={
                                        publication
                                            ? savedCommentIds.includes(
                                                createSavedCommentId(publication.id, publicationComment.id),
                                            )
                                            : false
                                    }
                                    isSaving={savingCommentIds.includes(publicationComment.id)}
                                    onOpenImages={openImagesViewer}
                                    onOpenProfile={(uid) => router.push(`/Profile?uid=${encodeURIComponent(uid)}`)}
                                    onToggleSave={() => toggleSaveComment(publicationComment.id)}
                                />
                            ))}

                            {comments.length === 0 ? (
                                <Text style={styles.emptyText}>Todavia no hay comentarios.</Text>
                            ) : null}
                        </View>
                    </>
                ) : null}
            </ScrollView>

            <ImageViewer
                images={viewerImages}
                initialIndex={selectedImageIndex}
                visible={viewerVisible}
                onClose={() => setViewerVisible(false)}
            />

            <ReportDialog
                visible={reportVisible}
                targetType="publication"
                targetId={publication?.id ?? ''}
                targetOwnerUid={publication?.uid}
                onClose={() => setReportVisible(false)}
            />

            <FooterApp />
        </SafeAreaView>
    );
}

function PostImageCarousel({
    images,
    onOpenImage,
}: {
    images: string[];
    onOpenImage: (index: number) => void;
}) {
    const {width} = useWindowDimensions();
    const imageWidth = Math.min(width - 32, 420);
    const imageHeight = Math.round(imageWidth * 0.72);

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.imageCarousel}
        >
            {images.map((image, index) => (
                <TouchableOpacity
                    key={`${image}-${index}`}
                    activeOpacity={0.9}
                    style={[styles.postImageButton, {width: imageWidth, height: imageHeight}]}
                    onPress={() => onOpenImage(index)}
                >
                    <Image source={{uri: image}} resizeMode="cover" style={styles.postImage} />
                </TouchableOpacity>
            ))}
        </ScrollView>
    );
}

function ImageViewer({
    images,
    initialIndex,
    visible,
    onClose,
}: {
    images: string[];
    initialIndex: number;
    visible: boolean;
    onClose: () => void;
}) {
    const {height, width} = useWindowDimensions();
    const scrollRef = useRef<ScrollView>(null);
    const [activeIndex, setActiveIndex] = useState(initialIndex);
    const [zoomScale, setZoomScale] = useState(1);

    useEffect(() => {
        if (!visible) {
            return;
        }

        setActiveIndex(initialIndex);
        setZoomScale(1);

        const timeout = setTimeout(() => {
            scrollRef.current?.scrollTo({x: width * initialIndex, animated: false});
        }, 0);

        return () => clearTimeout(timeout);
    }, [initialIndex, visible, width]);

    function handleScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
        const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);

        setActiveIndex(nextIndex);
        setZoomScale(1);
    }

    function goToImage(nextIndex: number) {
        const clampedIndex = Math.max(0, Math.min(images.length - 1, nextIndex));

        setActiveIndex(clampedIndex);
        setZoomScale(1);
        scrollRef.current?.scrollTo({x: width * clampedIndex, animated: true});
    }

    function updateZoom(nextZoom: number) {
        setZoomScale(Math.max(1, Math.min(3, nextZoom)));
    }

    return (
        <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
            <SafeAreaView style={styles.viewer}>
                <View style={styles.viewerTopBar}>
                    <TouchableOpacity style={styles.viewerIconButton} onPress={onClose}>
                        <Ionicons name="close" style={styles.viewerIcon} />
                    </TouchableOpacity>
                    <Text style={styles.viewerCounter}>
                        {images.length > 0 ? `${activeIndex + 1}/${images.length}` : '0/0'}
                    </Text>
                </View>

                <ScrollView
                    ref={scrollRef}
                    horizontal
                    pagingEnabled
                    scrollEnabled={zoomScale === 1}
                    showsHorizontalScrollIndicator={false}
                    onMomentumScrollEnd={handleScrollEnd}
                >
                    {images.map((image, index) => (
                        <View key={`${image}-${index}`} style={[styles.viewerPage, {width, minHeight: height}]}>
                            <ScrollView
                                centerContent
                                contentContainerStyle={[styles.viewerZoomContent, {minHeight: height * 0.78}]}
                                maximumZoomScale={4}
                                minimumZoomScale={1}
                                showsHorizontalScrollIndicator={false}
                                showsVerticalScrollIndicator={false}
                            >
                                <Image
                                    source={{uri: image}}
                                    resizeMode="contain"
                                    style={[
                                        styles.viewerImage,
                                        {
                                            width: width * 0.94,
                                            height: height * 0.72,
                                            transform: [{scale: index === activeIndex ? zoomScale : 1}],
                                        },
                                    ]}
                                />
                            </ScrollView>
                        </View>
                    ))}
                </ScrollView>

                <View style={styles.viewerBottomBar}>
                    <TouchableOpacity
                        style={[styles.viewerIconButton, activeIndex === 0 && styles.viewerDisabledButton]}
                        disabled={activeIndex === 0}
                        onPress={() => goToImage(activeIndex - 1)}
                    >
                        <Ionicons name="chevron-back" style={styles.viewerIcon} />
                    </TouchableOpacity>

                    <View style={styles.zoomControls}>
                        <TouchableOpacity
                            style={[styles.viewerIconButton, zoomScale <= 1 && styles.viewerDisabledButton]}
                            disabled={zoomScale <= 1}
                            onPress={() => updateZoom(zoomScale - 0.5)}
                        >
                            <Ionicons name="remove" style={styles.viewerIcon} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.viewerIconButton} onPress={() => updateZoom(1)}>
                            <Ionicons name="refresh" style={styles.viewerIcon} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.viewerIconButton, zoomScale >= 3 && styles.viewerDisabledButton]}
                            disabled={zoomScale >= 3}
                            onPress={() => updateZoom(zoomScale + 0.5)}
                        >
                            <Ionicons name="add" style={styles.viewerIcon} />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.viewerIconButton,
                            activeIndex === images.length - 1 && styles.viewerDisabledButton,
                        ]}
                        disabled={activeIndex === images.length - 1}
                        onPress={() => goToImage(activeIndex + 1)}
                    >
                        <Ionicons name="chevron-forward" style={styles.viewerIcon} />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </Modal>
    );
}

function CommentItem({
    comment,
    isSaved,
    isSaving,
    onOpenImages,
    onOpenProfile,
    onToggleSave,
}: {
    comment: PublicationComment;
    isSaved: boolean;
    isSaving: boolean;
    onOpenImages: (images: string[], index: number) => void;
    onOpenProfile: (uid: string) => void;
    onToggleSave: () => void;
}) {
    return (
        <View style={styles.commentItem}>
            <View style={styles.commentMeta}>
                <View style={styles.commentMetaText}>
                    <TouchableOpacity
                        activeOpacity={0.78}
                        onPress={() => onOpenProfile(comment.uid)}
                    >
                        <UserNameWithDiagnosis
                            userName={comment.userName}
                            uid={comment.uid}
                            size="small"
                            nameStyle={styles.commentAuthor}
                        />
                    </TouchableOpacity>
                    <Text style={styles.commentDate}>{formatDate(comment.createdAt)}</Text>
                </View>
                <TouchableOpacity
                    activeOpacity={0.78}
                    disabled={isSaving}
                    style={[styles.commentSaveButton, isSaving && styles.disabledButton]}
                    onPress={onToggleSave}
                >
                    <Ionicons
                        name={isSaved ? 'bookmark' : 'bookmark-outline'}
                        style={[styles.commentSaveIcon, isSaved && styles.commentSaveIconActive]}
                    />
                </TouchableOpacity>
            </View>
            {comment.text ? <Text style={styles.commentText}>{comment.text}</Text> : null}
            {comment.imagesUrls.length > 0 ? (
                <View style={styles.commentAttachedImages}>
                    {comment.imagesUrls.map((image, index) => (
                        <TouchableOpacity
                            key={`${image}-${index}`}
                            activeOpacity={0.9}
                            style={styles.commentAttachedImageButton}
                            onPress={() => onOpenImages(comment.imagesUrls, index)}
                        >
                            <Image source={{uri: image}} resizeMode="cover" style={styles.commentAttachedImage} />
                        </TouchableOpacity>
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
    loading: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    errorText: {
        color: '#a33b30',
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 12,
    },
    postHeader: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: 10,
        marginBottom: 12,
    },
    authorAvatar: {
        backgroundColor: '#dce3dd',
        borderRadius: 18,
        height: 36,
        width: 36,
    },
    authorInfo: {
        flex: 1,
    },
    author: {
        color: '#17211b',
        fontSize: 14,
        fontWeight: '800',
    },
    date: {
        color: '#65736a',
        fontSize: 13,
    },
    title: {
        color: '#111814',
        fontSize: 28,
        fontWeight: '800',
        lineHeight: 34,
    },
    description: {
        color: '#3d4a42',
        fontSize: 16,
        lineHeight: 24,
        marginTop: 12,
    },
    imageCarousel: {
        gap: 10,
        paddingRight: 16,
        paddingTop: 16,
    },
    postImageButton: {
        backgroundColor: '#dce3dd',
        borderRadius: 8,
        overflow: 'hidden',
    },
    postImage: {
        width: '100%',
        height: '100%',
    },
    tags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 16,
    },
    tag: {
        backgroundColor: '#eef3ef',
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    tagText: {
        color: '#405348',
        fontSize: 12,
        fontWeight: '700',
    },
    commentsHeader: {
        alignItems: 'center',
        borderTopColor: '#dce3dd',
        borderTopWidth: 1,
        flexDirection: 'row',
        gap: 8,
        marginTop: 24,
        paddingTop: 18,
    },
    commentsTitle: {
        color: '#111814',
        fontSize: 20,
        fontWeight: '800',
    },
    commentsCount: {
        color: '#65736a',
        fontSize: 14,
        fontWeight: '700',
    },
    commentComposer: {
        marginTop: 12,
    },
    commentInput: {
        backgroundColor: '#ffffff',
        borderColor: '#dce3dd',
        borderRadius: 8,
        borderWidth: 1,
        color: '#111814',
        minHeight: 86,
        padding: 10,
        textAlignVertical: 'top',
    },
    commentButton: {
        alignItems: 'center',
        alignSelf: 'flex-end',
        backgroundColor: '#20352b',
        borderRadius: 8,
        justifyContent: 'center',
        marginTop: 10,
        minHeight: 40,
        paddingHorizontal: 14,
    },
    disabledButton: {
        opacity: 0.7,
    },
    commentButtonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '800',
    },
    commentImageRow: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: 8,
        marginTop: 10,
    },
    commentImageButton: {
        alignItems: 'center',
        backgroundColor: '#444',
        borderRadius: 8,
        height: 44,
        justifyContent: 'center',
        width: 44,
    },
    commentImageButtonIcon: {
        color: '#ffffff',
        fontSize: 20,
        fontWeight: '800',
    },
    commentImagePreviewList: {
        flexDirection: 'row',
        gap: 8,
    },
    commentImagePreviewWrap: {
        borderRadius: 8,
        height: 44,
        overflow: 'hidden',
        width: 44,
    },
    commentImagePreview: {
        height: '100%',
        width: '100%',
    },
    removeImageButton: {
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.58)',
        borderRadius: 9,
        height: 18,
        justifyContent: 'center',
        position: 'absolute',
        right: 3,
        top: 3,
        width: 18,
    },
    removeImageIcon: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: '800',
    },
    commentList: {
        gap: 10,
        marginTop: 16,
    },
    commentItem: {
        backgroundColor: '#ffffff',
        borderColor: '#dce3dd',
        borderRadius: 8,
        borderWidth: 1,
        padding: 12,
    },
    commentMeta: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: 8,
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    commentMetaText: {
        flexDirection: 'row',
        flexShrink: 1,
        flexWrap: 'wrap',
        gap: 8,
    },
    commentAuthor: {
        color: '#17211b',
        fontSize: 13,
        fontWeight: '800',
    },
    commentDate: {
        color: '#65736a',
        fontSize: 12,
    },
    commentSaveButton: {
        alignItems: 'center',
        height: 30,
        justifyContent: 'center',
        width: 30,
    },
    commentSaveIcon: {
        color: '#526057',
        fontSize: 20,
    },
    commentSaveIconActive: {
        color: '#20352b',
    },
    commentText: {
        color: '#3d4a42',
        fontSize: 14,
        lineHeight: 21,
    },
    commentAttachedImages: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 10,
    },
    commentAttachedImageButton: {
        backgroundColor: '#dce3dd',
        borderRadius: 8,
        height: 74,
        overflow: 'hidden',
        width: 74,
    },
    commentAttachedImage: {
        height: '100%',
        width: '100%',
    },
    emptyText: {
        color: '#65736a',
        fontSize: 14,
        lineHeight: 20,
    },
    viewer: {
        backgroundColor: '#000000',
        flex: 1,
    },
    viewerTopBar: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        left: 0,
        paddingHorizontal: 14,
        paddingVertical: 10,
        position: 'absolute',
        right: 0,
        top: 0,
        zIndex: 2,
    },
    viewerBottomBar: {
        alignItems: 'center',
        bottom: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        left: 0,
        paddingBottom: 18,
        paddingHorizontal: 16,
        paddingTop: 10,
        position: 'absolute',
        right: 0,
        zIndex: 2,
    },
    viewerIconButton: {
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.16)',
        borderRadius: 8,
        height: 42,
        justifyContent: 'center',
        width: 42,
    },
    viewerDisabledButton: {
        opacity: 0.35,
    },
    viewerIcon: {
        color: '#ffffff',
        fontSize: 24,
        fontWeight: '800',
    },
    viewerCounter: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '800',
    },
    viewerPage: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    viewerZoomContent: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    viewerImage: {
        alignSelf: 'center',
    },
    zoomControls: {
        flexDirection: 'row',
        gap: 10,
    },
});
