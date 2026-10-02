import {
    ActivityIndicator,
    Image,
    SafeAreaView, ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

import {FooterApp} from "@/components/Footer";
import {TagSelector} from "@/components/TagSelector";
import {interestTags} from "@/lib/Data";
import React, {useState} from "react";
import {router} from "expo-router";
import {Ionicons} from "@expo/vector-icons";
import {createPublication} from '@/services/users';
import {getFirebaseAuth} from "@/services/firebase";
import {FirebaseError} from "firebase/app";
import {pickImage} from "./Onboarding";
import {uploadOptionalImageToCloudinary} from "@/services/cloudinary";
import {MAX_PUBLICATION_IMAGES} from "@/constants/publications";

export default function Publish() {

    const [interests, setInterests] = useState<string[]>([]);
    const [images, setImages] = useState<string[]>([]);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [error, setError] = useState("");
    const [isPublishing, setIsPublishing] = useState(false);

    async function PublishPost() {
        const user = getFirebaseAuth().currentUser;
        const cleanTitle = title.trim();
        const cleanDescription = description.trim();

        if (!user) {
            setError('Necesitas iniciar sesion para publicar.');
            return;
        }

        if (!cleanTitle || !cleanDescription || interests.length == 0) {
            setError('Completa el titulo, la descripcion y los intereses.');
            return;
        }

        if (images.length > MAX_PUBLICATION_IMAGES) {
            setError(`Solo puedes publicar hasta ${MAX_PUBLICATION_IMAGES} imagenes.`);
            return;
        }

        setIsPublishing(true);
        setError('');

        try {
            const uploadedUrls = await Promise.all(
                images.map((image, index) =>
                    uploadOptionalImageToCloudinary(image, `post-${user.uid}-${Date.now()}-${index}`)
                )
            );
            const imageUrls = uploadedUrls.filter((url): url is string => url !== null);

            await createPublication({
                uid: user.uid,
                title: cleanTitle,
                interests,
                description: cleanDescription,
                imagesUrls: imageUrls
            });

            router.back();
        } catch (publishError) {
            if (publishError instanceof FirebaseError) {
                setError(`No se pudo publicar. Firebase: ${publishError.code}.`);
                return;
            }

            setError(publishError instanceof Error ? publishError.message : 'No se pudo publicar.');
        } finally {
            setIsPublishing(false);
        }
    }

    function AddImageToPost(uri: string) {
        setImages((currentImages) => {
            if (currentImages.length >= MAX_PUBLICATION_IMAGES) {
                setError(`Solo puedes publicar hasta ${MAX_PUBLICATION_IMAGES} imagenes.`);
                return currentImages;
            }

            setError('');
            return [...currentImages, uri];
        });
    }

    function removeImageFromPost(indexToRemove: number) {
        setImages((currentImages) => currentImages.filter((_, index) => index !== indexToRemove));
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.sectionLike}>
                <View style={styles.actions}>
                    <TouchableOpacity style={styles.footerButton}
                                      onPress={() => router.back()}>
                        <Ionicons name="close" style={styles.footerButtonText}></Ionicons>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.footerButton}
                                      disabled={isPublishing}
                                      onPress={PublishPost}>
                        {isPublishing ? (
                            <ActivityIndicator color="#ffffff" />
                        ) : (
                            <Text style={styles.footerButtonText}>Publicar</Text>
                        )}
                    </TouchableOpacity>
                </View>
                {error ? <Text style={styles.errorText}>{error}</Text> : null}
                <TextInput
                    style={styles.titleInput}
                    placeholder="Titulo"
                    multiline
                    numberOfLines={4}
                    onChangeText={setTitle}
                />
                <TagSelector
                    interests={interestTags}
                    value={interests}
                    onValueChange={setInterests}
                    contentItemsSize={0}
                    maxItemsSelect={1}
                />
                <TextInput
                    style={styles.contentInput}
                    placeholder="Escribe lo que quieras ..."
                    multiline
                    numberOfLines={4}
                    onChangeText={setDescription}
                />
                <View style={styles.imageRow}>
                    <TouchableOpacity
                        style={[
                            styles.pickImageButton,
                            images.length >= MAX_PUBLICATION_IMAGES && styles.disabledButton,
                        ]}
                        disabled={isPublishing || images.length >= MAX_PUBLICATION_IMAGES}
                        onPress={() => pickImage(AddImageToPost)}
                    >
                        <Text>+</Text>
                    </TouchableOpacity>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.photoPickedContainer}
                    >
                        {images.map((image, index) => (
                            <View key={index} style={styles.backgroundPicker}>
                                <Image
                                    source={{uri: image}}
                                    resizeMode="cover"
                                    style={styles.backgroundPreview}
                                />
                                <TouchableOpacity
                                    style={styles.removeImageButton}
                                    onPress={() => removeImageFromPost(index)}
                                >
                                    <Ionicons name="close" style={styles.removeImageIcon}></Ionicons>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            </View>
            <FooterApp/>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f4f6f3'
    },
    sectionLike: {
        flex: 1,
        marginTop: 8,
        margin: 20,
        marginBottom: 80
    },
    actions: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    contentInput: {
        flex: 1,
        borderRadius: 8,
        minHeight: 80,
        padding: 10,
        textAlignVertical: 'top',
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#cccccc'
    },
    titleInput: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderRadius: 8,
        height: 50,
        padding: 10,
        fontWeight: "bold",
        fontSize: 20,
        marginTop: 10,
        borderColor: '#cccccc'
    },
    subtitle: {
        color: '#526057',
        fontSize: 16,
        lineHeight: 23,
        marginTop: 8
    },

    footerButton: {
        height: 30,
        marginHorizontal: 4,
        borderRadius: 8,
        alignItems: 'center',
        backgroundColor: '#444',
        justifyContent: 'center',
        paddingHorizontal: 10
    },

    footerButtonText: {
        color: 'white',
        fontWeight: 'bold',
        tintColor: 'white',
        textAlign: 'center',
        textAlignVertical: 'center',
        fontSize: 20,
        lineHeight: 30
    },
    errorText: {
        color: '#a33b30',
        fontSize: 14,
        lineHeight: 20,
        marginTop: 12,
    },
    photoPickerText: {
        color: '#405348',
        fontSize: 13,
        fontWeight: '800',
    },
    photoEditBadge: {
        alignItems: 'center',
        backgroundColor: '#20352b',
        borderRadius: 12,
        bottom: 5,
        height: 24,
        justifyContent: 'center',
        position: 'absolute',
        right: 5,
        width: 24,
    },
    photoEditBadgeText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '800',
        lineHeight: 21,
    },
    imageRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },

    pickImageButton: {
        width: 48,
        height: 48,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#444',
    },
    disabledButton: {
        opacity: 0.45,
    },

    photoPickedContainer: {
        flexDirection: 'row',
        gap: 8,
    },

    backgroundPicker: {
        width: 48,
        height: 48,
        borderRadius: 8,
        overflow: 'hidden',
    },

    backgroundPreview: {
        width: '100%',
        height: '100%',
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
});
