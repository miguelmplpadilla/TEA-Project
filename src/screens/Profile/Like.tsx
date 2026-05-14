import {useState} from 'react';
import {StyleSheet, Text, TextInput, View} from 'react-native';
import {TagSelector} from '../../components/TagSelector';
import {SelectComponent, type SelectOption} from "@/components/SelectComponent";
import {comfortSkillOptions, interestTags, lookingForOptions, socialSkillsOptions} from "@/lib/Data";

export function Like() {
    const [socialSkill, setSocialSkill] = useState<SelectOption[]>([]);
    const [comfort, setComfort] = useState<SelectOption[]>([]);
    const [lookingFor, setLookingFor] = useState<SelectOption[]>([]);
    const [interests, setInterests] = useState<string[]>([]);
    const [talkAbout, setTalkAbout] = useState<string[]>([]);

    return (
        <View style={styles.listContent}>
            <View style={styles.header}>
                <Text style={styles.title}>Como soy</Text>

                <View style={styles.sectionLike}>
                    <Text style={styles.subtitle}>Descripción</Text>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Escribe sobre ti ..."
                        multiline
                        numberOfLines={4}
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
                    <SelectComponent
                        options={lookingForOptions}
                        value={lookingFor}
                        onValueChange={setLookingFor}
                    />
                </View>
            </View>
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
});
