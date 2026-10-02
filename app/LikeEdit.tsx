import {FirebaseError} from 'firebase/app';
import {onAuthStateChanged} from 'firebase/auth';
import {doc, getDoc} from 'firebase/firestore';
import React, {forwardRef, type Ref, useEffect, useImperativeHandle, useState} from 'react';
import {ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';

import {SelectComponent, type SelectOption} from '@/components/SelectComponent';
import {TagSelector} from '@/components/TagSelector';
import {comfortSkillOptions, interestTags, lookingForOptions, socialSkillsOptions} from '@/lib/Data';
import {uploadOptionalImageToCloudinary} from '@/services/cloudinary';
import {getFirebaseAuth, getFirebaseFirestore} from '@/services/firebase';
import {markPsychologistAccreditationPromptPressed, type UserProfile, updateUserProfile} from '@/services/users';
import {defaultTeaDiagnosis, teaDiagnosisOptions} from '@/constants/teaDiagnosis';
import {type Href, router} from "expo-router";
import {Ionicons} from "@expo/vector-icons";

export type LikeEditHandle = {
    save: () => void;
};

type LikeEditProps = {
    profileImageUri?: string | null;
    profileBackgroundUri?: string | null;
    onImagesUploaded?: (images: {profileImageUrl: string | null; profileBackgroundUrl: string | null}) => void;
    onSaved?: () => void;
    onStateChange?: (state: {isSaving: boolean}) => void;
};

function LikeEdit(
    {profileImageUri, profileBackgroundUri, onImagesUploaded, onSaved, onStateChange}: LikeEditProps,
    ref: Ref<LikeEditHandle>,
) {
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [socialSkill, setSocialSkill] = useState<SelectOption[]>([]);
    const [comfort, setComfort] = useState<SelectOption[]>([]);
    const [lookingFor, setLookingFor] = useState<SelectOption[]>([]);
    const [teaDiagnosis, setTeaDiagnosis] = useState<SelectOption[]>([]);
    const [interests, setInterests] = useState<string[]>([]);
    const [description, setDescription] = useState('');
    const [declaredPsychologist, setDeclaredPsychologist] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');
    const [saveError, setSaveError] = useState('');
    const shouldShowAccreditationButton =
        declaredPsychologist &&
        userProfile !== null &&
        userProfile.psychologistVerificationStatus !== 'verified' &&
        !userProfile.psychologistAccreditationPromptPressedAt;

    async function handleSave() {
        const authUser = getFirebaseAuth().currentUser;

        if (!authUser) {
            setSaveError('No hay un usuario autenticado.');
            return;
        }

        setIsSaving(true);
        setSaveMessage('');
        setSaveError('');

        try {
            const profileImageUrl = await uploadOptionalImageToCloudinary(
                profileImageUri,
                `${authUser.uid}-profile`,
            );
            const profileBackgroundUrl = await uploadOptionalImageToCloudinary(
                profileBackgroundUri,
                `${authUser.uid}-background`,
            );

            await updateUserProfile({
                uid: authUser.uid,
                profile: {
                    teaDiagnosis: (teaDiagnosis[0]?.value as UserProfile['teaDiagnosis'] | undefined) ?? defaultTeaDiagnosis,
                    profileImageUrl,
                    profileBackgroundUrl,
                    description,
                    interests,
                    socialSkills: socialSkill,
                    comfortOptions: comfort,
                    lookingFor,
                    declaredPsychologist,
                },
            });

            onImagesUploaded?.({profileImageUrl, profileBackgroundUrl});
            setUserProfile((currentProfile) =>
                currentProfile
                    ? {
                        ...currentProfile,
                        declaredPsychologist,
                    }
                    : currentProfile,
            );
            setSaveMessage('Perfil actualizado.');
            onSaved?.();
        } catch (error) {
            if (error instanceof FirebaseError) {
                setSaveError(`No se pudo guardar el perfil. Firebase: ${error.code}.`);
                return;
            }

            setSaveError('No se pudo guardar el perfil.');
        } finally {
            setIsSaving(false);
        }
    }

    async function handlePsychologistAccreditationPress() {
        const authUser = getFirebaseAuth().currentUser;

        if (!authUser) {
            setSaveError('No hay un usuario autenticado.');
            return;
        }

        try {
            await markPsychologistAccreditationPromptPressed(authUser.uid);
            setUserProfile((currentProfile) =>
                currentProfile
                    ? {
                        ...currentProfile,
                        declaredPsychologist: true,
                        psychologistAccreditationPromptPressedAt: new Date(),
                    }
                    : currentProfile,
            );
            router.push('/PsychologistVerification' as Href);
        } catch {
            setSaveError('No se pudo preparar la acreditacion. Intentalo de nuevo.');
        }
    }

    useImperativeHandle(ref, () => ({
        save: handleSave,
    }));

    useEffect(() => {
        onStateChange?.({isSaving});
    }, [isSaving, onStateChange]);

    useEffect(() => {
        function resetProfileState() {
            setUserProfile(null);
            setSocialSkill([]);
            setComfort([]);
            setLookingFor([]);
            setTeaDiagnosis([]);
            setInterests([]);
            setDescription('');
            setDeclaredPsychologist(false);
        }

        const unsubscribe = onAuthStateChanged(getFirebaseAuth(), async (authUser) => {
            if (!authUser) {
                resetProfileState();
                return;
            }

            const userRef = doc(getFirebaseFirestore(), 'users', authUser.uid);
            const userSnapshot = await getDoc(userRef);

            if (userSnapshot.exists()) {
                const profile = userSnapshot.data() as UserProfile;

                setUserProfile(profile);
                setSocialSkill(profile.socialSkills ?? []);
                setComfort(profile.comfortOptions ?? []);
                setLookingFor(profile.lookingFor ?? []);
                setTeaDiagnosis(teaDiagnosisOptions.filter((option) => option.value === profile.teaDiagnosis));
                setInterests(profile.interests ?? []);
                setDescription(profile.description ?? '');
                setDeclaredPsychologist(profile.declaredPsychologist === true);
            } else {
                resetProfileState();
            }
        });

        return unsubscribe;
    }, []);

    return (
        <View style={styles.listContent}>
            <View style={styles.header}>
                <Text style={styles.title}>Como soy</Text>

                <View style={styles.sectionLike}>
                    <Text style={styles.subtitle}>Diagnostico</Text>
                    <SelectComponent
                        options={teaDiagnosisOptions}
                        value={teaDiagnosis}
                        onValueChange={setTeaDiagnosis}
                        maxItemsSelect={1}
                        contentItemsSize={150}
                    />
                </View>

                <View style={styles.sectionLike}>
                    <Text style={styles.subtitle}>Descripcion</Text>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Escribe sobre ti ..."
                        multiline
                        numberOfLines={4}
                        value={description}
                        onChangeText={setDescription}
                    />
                </View>

                <View style={styles.sectionLike}>
                    <Text style={styles.subtitle}>Intereses</Text>
                    <TagSelector
                        interests={interestTags}
                        value={interests}
                        onValueChange={setInterests}
                    />
                </View>

                <View style={styles.sectionLike}>
                    <Text style={styles.subtitle}>Como soy socialmente</Text>
                    <SelectComponent
                        options={socialSkillsOptions}
                        value={socialSkill}
                        onValueChange={setSocialSkill}
                    />
                </View>

                <View style={styles.sectionLike}>
                    <Text style={styles.subtitle}>Comfort</Text>
                    <SelectComponent
                        options={comfortSkillOptions}
                        value={comfort}
                        onValueChange={setComfort}
                    />
                </View>

                <View style={styles.sectionLike}>
                    <Text style={styles.subtitle}>Que busco</Text>
                    <SelectComponent
                        options={lookingForOptions}
                        value={lookingFor}
                        onValueChange={setLookingFor}
                    />
                </View>

                <TouchableOpacity
                    activeOpacity={0.82}
                    style={styles.psychologistOption}
                    onPress={() => setDeclaredPsychologist((currentValue) => !currentValue)}
                >
                    <View style={[styles.psychologistCheckbox, declaredPsychologist && styles.psychologistCheckboxChecked]}>
                        {declaredPsychologist ? (
                            <Ionicons name="checkmark" style={styles.psychologistCheckboxIcon}></Ionicons>
                        ) : null}
                    </View>
                    <Text style={styles.psychologistOptionText}>Soy psicologa colegiada</Text>
                </TouchableOpacity>

                {shouldShowAccreditationButton ? (
                    <View style={styles.ownerActions}>
                        <TouchableOpacity
                            activeOpacity={0.82}
                            style={styles.verificationButton}
                            onPress={handlePsychologistAccreditationPress}
                        >
                            <Ionicons name="shield-checkmark" style={styles.verificationButtonIcon}></Ionicons>
                            <Text style={styles.verificationButtonText}>Acreditar que eres psicologo</Text>
                        </TouchableOpacity>
                    </View>
                ) : null}

                {saveError ? <Text style={styles.errorText}>{saveError}</Text> : null}
                {saveMessage ? <Text style={styles.successText}>{saveMessage}</Text> : null}
            </View>
        </View>
    );
}

export default forwardRef(LikeEdit);

type LikeEditFooterProps = {
    isSaving: boolean;
    onCancel: () => void;
    onSave: () => void;
};

export function LikeEditFooter({isSaving, onCancel, onSave}: LikeEditFooterProps) {
    return (
        <View pointerEvents="box-none" style={styles.overlay}>
            <View style={styles.footer}>
                <TouchableOpacity style={styles.footerButton} onPress={onCancel}>
                    <Text style={styles.footerButtonText}>Volver</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.footerButton} disabled={isSaving} onPress={onSave}>
                    {isSaving ? (
                        <ActivityIndicator color="#ffffff" />
                    ) : (
                        <Text style={styles.footerButtonText}>Save</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    listContent: {
        padding: 16,
        paddingTop: 5,
        paddingBottom: 150,
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
    subtitle: {
        color: '#526057',
        fontSize: 16,
        lineHeight: 23,
        marginTop: 8,
    },
    sectionLike: {
        marginTop: 8,
    },
    searchInput: {
        backgroundColor: '#ffffff',
        borderColor: '#dce3dd',
        borderRadius: 8,
        borderWidth: 1,
        minHeight: 80,
        padding: 10,
        textAlignVertical: 'top',
    },
    overlay: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 60,
        backgroundColor: '#9a9a9a',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    footerButton: {
        flex: 1,
        height: 44,
        marginHorizontal: 4,
        borderRadius: 8,
        alignItems: 'center',
        backgroundColor: '#444',
        justifyContent: 'center',
    },
    errorText: {
        color: '#a33b30',
        fontSize: 14,
        lineHeight: 20,
        marginTop: 14,
    },
    successText: {
        color: '#1e6a45',
        fontSize: 14,
        lineHeight: 20,
        marginTop: 14,
    },
    footerButtonText: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    ownerActions: {
        backgroundColor: '#f4f6f3',
        paddingVertical: 10,
        marginTop: 10
    },
    psychologistOption: {
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderColor: '#dce3dd',
        borderRadius: 8,
        borderWidth: 1,
        flexDirection: 'row',
        gap: 10,
        marginTop: 18,
        minHeight: 44,
        paddingHorizontal: 12,
    },
    psychologistCheckbox: {
        alignItems: 'center',
        borderColor: '#7b8f83',
        borderRadius: 5,
        borderWidth: 2,
        height: 24,
        justifyContent: 'center',
        width: 24,
    },
    psychologistCheckboxChecked: {
        backgroundColor: '#20352b',
        borderColor: '#20352b',
    },
    psychologistCheckboxIcon: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '800',
    },
    psychologistOptionText: {
        color: '#20352b',
        flex: 1,
        fontSize: 14,
        fontWeight: '800',
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
});
