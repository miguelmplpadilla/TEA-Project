import {Button, FlatList, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';

import {FooterApp} from "@/components/Footer";
import {TagSelector} from "@/components/TagSelector";
import {interestTags} from "@/lib/Data";
import {useState} from "react";
import {router} from "expo-router";
import {Ionicons} from "@expo/vector-icons";

export default function Publish() {

    const [interests, setInterests] = useState<string[]>([]);

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.sectionLike}>
                <View style={styles.actions}>
                    <TouchableOpacity style={styles.footerButton}
                                      onPress={() => router.back()}>
                        <Ionicons name="close" style={styles.footerButtonText}></Ionicons>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.footerButton}>
                        <Text style={styles.footerButtonText}>Publicar</Text>
                    </TouchableOpacity>
                </View>
                <TextInput
                    style={styles.titleInput}
                    placeholder="Titulo"
                    multiline
                    numberOfLines={4}
                />
                <TagSelector
                    interests={interestTags}
                    value={interests}
                    onValueChange={setInterests}
                    contentItemsSize={0}
                />
                <TextInput
                    style={styles.contentInput}
                    placeholder="Escribe sobre ti ..."
                    multiline
                    numberOfLines={4}
                />
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
        borderWidth: 0,
    },
    titleInput: {
        backgroundColor: 'transparent',
        borderWidth: 0,
        borderRadius: 8,
        height: 50,
        padding: 10,
        fontWeight: "bold",
        fontSize: 20,
        marginTop: 10,
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
});
