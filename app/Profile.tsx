import {SafeAreaView, StyleSheet, Image, ScrollView, View, Text, TouchableOpacity} from 'react-native';
import {FooterApp} from "@/components/Footer";
import {useState} from 'react';
import {Ionicons} from "@expo/vector-icons";
import {Posts} from "@/screens/Profile/Posts";
import {Like} from "@/screens/Profile/Like";
import React, { useRef } from 'react';

export default function Profile() {

    const scrollRef = useRef<ScrollView>(null);
    const [activeSection, setActiveSection] = useState('like')

    function SetActiveSession(value: string) {
        setActiveSection(value)
        scrollRef.current?.scrollTo({
            y: 0,
            animated: true,
        });
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                ref={scrollRef}
            >
                <View
                    style={styles.profileBackground}
                >
                    <Image
                        source={require('../assets/images/DefaultPorfilePicture.png')}
                        style={styles.profileImage}
                    />
                    <Text style={styles.userName}>User Name</Text>
                </View>

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

                    <TouchableOpacity style={styles.navBarButton}
                                      onPress={() => SetActiveSession('saves')}>
                        <Ionicons name="bookmark" style={styles.navBarButtonText}></Ionicons>
                    </TouchableOpacity>
                </View>

                {activeSection === 'like' && (
                    <Like/>
                )}

                {activeSection === 'posts' && (
                    <Posts/>
                )}

                {activeSection === 'comments' && (
                    <Text style={styles.sectionContent}>Comentarios del usuario</Text>
                )}

                {activeSection === 'saves' && (
                    <Text style={styles.sectionContent}>Guardados del usuario</Text>
                )}
            </ScrollView>

            <FooterApp/>
        </SafeAreaView>
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
        backgroundColor: "#bababa"
    },
    profileBackgroundImage: {
        opacity: 0.35,
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    userName: {
        color: '#17211b',
        fontSize: 20,
        fontWeight: '700',
        marginTop: 5
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
