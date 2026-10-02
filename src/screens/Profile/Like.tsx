import {useEffect, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {type SelectOption} from "@/components/SelectComponent";
import { doc, getDoc } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseFirestore } from '@/services/firebase';
import {onAuthStateChanged} from "firebase/auth";
import {type UserProfile} from '@/services/users';

export function Like() {
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

    const [socialSkill, setSocialSkill] = useState<SelectOption[]>([]);
    const [comfort, setComfort] = useState<SelectOption[]>([]);
    const [lookingFor, setLookingFor] = useState<SelectOption[]>([]);
    const [interests, setInterests] = useState<string[]>([]);
    const [description, setDescription] = useState('');
    const [talkAbout, setTalkAbout] = useState<string[]>([]);

    useEffect(() => {
        function resetProfileState() {
            setUserProfile(null);
            setSocialSkill([]);
            setComfort([]);
            setLookingFor([]);
            setInterests([]);
            setDescription('');
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
                setInterests(profile.interests ?? []);
                setDescription(profile.description ?? '');
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
                    <Text style={styles.subtitle}>Descripción</Text>
                    <Text
                        style={styles.searchInput}
                    >{description}</Text>
                </View>

                <View style={styles.sectionLike}>
                    <Text style={styles.subtitle}>Intereses</Text>
                    <View style={styles.selectedTags}>
                        {interests.map((interest) => (
                            <View
                                key={interest}
                                style={[styles.tag, styles.selectedTag]}
                            >
                                <Text style={[styles.tagText, styles.selectedTagText]}>
                                    {interest}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>

                <View style={styles.sectionLike}>
                    <Text style={styles.subtitle}>Como soy socialmente</Text>
                    <SelectionList options={socialSkill} />
                </View>

                <View style={styles.sectionLike}>
                    <Text style={styles.subtitle}>Comfort</Text>
                    <SelectionList options={comfort} />
                </View>

                { /*<View style={styles.sectionLike}>
                    <Text style={styles.subtitle}>Hablame de</Text>
                    <TagSelector
                        interests={interestTags}
                        value={talkAbout}
                        onValueChange={setTalkAbout}
                    />
                </View>*/ }

                <View style={styles.sectionLike}>
                    <Text style={styles.subtitle}>Que busco</Text>
                    <SelectionList options={lookingFor} />
                </View>
            </View>
        </View>
    );
}

type SelectionListProps = {
    options: SelectOption[];
};

function SelectionList({ options }: SelectionListProps) {
    return (
        <View style={styles.searchBox}>
            {options.map((option) => (
                <View key={option.value} style={styles.selectedChip}>
                    <Text style={styles.selectedChipText} numberOfLines={1}>
                        {option.label}
                    </Text>
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    listContent: {
        padding: 16,
        paddingTop: 5,
        paddingBottom: 150
    },
    header: {
        paddingBottom: 18
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
    sectionLike: {
        marginTop: 8
    },
    searchInput: {
        backgroundColor: '#ffffff',
        borderColor: '#dce3dd',
        borderRadius: 8,
        borderWidth: 1,
        minHeight: 80,
        padding: 10,
        textAlignVertical: 'top'
    },
    selectedOption: {
        backgroundColor: '#20352b',
        borderColor: '#20352b',
    },
    searchBox: {
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderColor: '#dce3dd',
        borderRadius: 8,
        borderWidth: 0,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        minHeight: 42,
        paddingHorizontal: 8,
        paddingVertical: 6,
    },
    selectedChip: {
        alignItems: 'center',
        backgroundColor: '#20352b',
        borderRadius: 999,
        flexDirection: 'row',
        paddingLeft: 10,
        paddingRight: 5,
        paddingVertical: 5,
    },
    selectedChipText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '800'
    },
    tag: {
        backgroundColor: '#ffffff',
        borderColor: '#dce3dd',
        borderRadius: 999,
        borderWidth: 1,
        paddingHorizontal: 12,
        paddingVertical: 7
    },
    selectedTag: {
        backgroundColor: '#20352b',
        borderColor: '#20352b'
    },
    selectedTagText: {
        color: '#ffffff'
    },
    tagText: {
        color: '#405348',
        fontSize: 13,
        fontWeight: '600'
    },
    selectedTags: {
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderColor: '#dce3dd',
        borderRadius: 8,
        borderWidth: 0,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        minHeight: 42,
        paddingHorizontal: 8,
        paddingVertical: 6,
    },
});
