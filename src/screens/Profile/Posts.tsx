import {StyleSheet, Text, View} from 'react-native';
import {PostCard} from "@/components/PostCard";
import {getPublications, type Publication} from '@/services/users';
import {useEffect, useState} from "react";
import {UserNameWithDiagnosis} from '@/components/UserNameWithDiagnosis';
import type {TeaDiagnosis} from '@/constants/teaDiagnosis';

type PostsProps = {
    userName: string;
    teaDiagnosis?: TeaDiagnosis;
};

export function Posts({userName, teaDiagnosis}: PostsProps) {
    const [publications, setPublications] = useState<Publication[]>([]);

    useEffect(() => {
        async function GetPublications() {
            const value = await getPublications();
            setPublications(value);
        }

        GetPublications();
    }, []);


    return (
        <View style={styles.listContent}>
            <View style={styles.header}>
                <Text style={styles.title}>Publicaciones de</Text>
                <UserNameWithDiagnosis
                    userName={userName}
                    teaDiagnosis={teaDiagnosis}
                    size="large"
                    nameStyle={styles.title}
                />
            </View>

            {publications.map((post, index) => (
                <View key={post.id}>
                    <PostCard post={post} />
                    {index < publications.length - 1 && <View style={styles.separator} />}
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    listContent: {
        padding: 16,
        paddingTop: 5,
        paddingBottom: 70
    },
    header: {
        paddingBottom: 18
    },
    eyebrow: {
        color: '#526057',
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 0,
        marginBottom: 8
    },
    title: {
        color: '#111814',
        fontSize: 28,
        fontWeight: '700',
        lineHeight: 34
    },
    separator: {
        height: 12
    },
});
