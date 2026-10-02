import React, {useEffect, useState} from 'react';
import {Image, Pressable, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {router} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';

import {OptionsMenu} from '@/components/OptionsMenu';
import {ReportDialog} from '@/components/ReportDialog';
import {UserNameWithDiagnosis} from '@/components/UserNameWithDiagnosis';
import {getFirebaseAuth} from '@/services/firebase';
import {
  getUserById,
  removeSavedPublicationForUser,
  savePublicationForUser,
  type Publication,
  type UserProfile,
} from '@/services/users';
import type {Post} from '@/types/post';

type PostCardProps = {
  post: Publication | Post;
};

export function PostCard({post}: PostCardProps) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const author = userProfile?.userName ?? ('author' in post ? post.author : 'Usuario');
  const profileImageUrl = userProfile?.profileImageUrl ?? null;
  const profileUid = 'uid' in post ? post.uid : userProfile?.uid;
  const createdAt = formatCreatedAt(post.createdAt);
  const body = 'description' in post ? post.description : post.body;
  const tags = 'interests' in post ? post.interests : post.tags;
  const commentCount = 'commentCount' in post ? post.commentCount : post.comments.length;

  useEffect(() => {
    async function loadPostUser() {
      if (!('uid' in post)) {
        return;
      }

      const user = await getUserById(post.uid);

      if (!user) {
        console.log('Usuario no encontrado');
        return;
      }

      setUserProfile(user);
    }

    loadPostUser();
  }, [post]);

  useEffect(() => {
    async function loadSavedState() {
      const authUser = getFirebaseAuth().currentUser;

      if (!authUser || !('uid' in post)) {
        setIsSaved(false);
        return;
      }

      const currentUserProfile = await getUserById(authUser.uid);
      setIsSaved(currentUserProfile?.savedPublicationIds.includes(post.id) ?? false);
    }

    loadSavedState();
  }, [post]);

  function handleOpenPost() {
    if (!('uid' in post)) {
      return;
    }

    router.push({
      pathname: '/Post',
      params: {publicationId: post.id},
    });
  }

  function handleOpenProfile() {
    if (!profileUid) {
      return;
    }

    router.push(`/Profile?uid=${encodeURIComponent(profileUid)}`);
  }

  async function handleToggleSave() {
    const authUser = getFirebaseAuth().currentUser;

    if (!authUser || !('uid' in post) || isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      if (isSaved) {
        await removeSavedPublicationForUser(authUser.uid, post.id);
        setIsSaved(false);
      } else {
        await savePublicationForUser(authUser.uid, post.id);
        setIsSaved(true);
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Pressable
          style={({pressed}) => [styles.header, pressed && styles.headerPressed]}
          onPress={handleOpenProfile}
        >
          <View style={styles.avatar}>
            <Image
              source={
                profileImageUrl
                  ? {uri: profileImageUrl}
                  : require('../../assets/images/DefaultPorfilePicture.png')
              }
              resizeMode="cover"
              style={styles.avatarImage}
            />
          </View>

          <View style={styles.authorBlock}>
            <UserNameWithDiagnosis
              userName={author}
              teaDiagnosis={userProfile?.teaDiagnosis}
              uid={profileUid}
              nameStyle={styles.author}
            />
            <Text style={styles.meta}>
              {createdAt}
            </Text>
          </View>
        </Pressable>

        {'uid' in post ? (
          <OptionsMenu
            accessibilityLabel="Opciones de publicacion"
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

      <Pressable style={({pressed}) => pressed && styles.cardPressed} onPress={handleOpenPost}>
        <Text style={styles.title}>{post.title}</Text>
        <Text style={styles.body}>{body}</Text>

        <View style={styles.tags}>
          {tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </Pressable>

      <View style={styles.footer}>
        <Text style={styles.footerItem}>{commentCount} respuestas</Text>
        {'uid' in post ? (
          <TouchableOpacity
            activeOpacity={0.78}
            disabled={isSaving}
            style={styles.saveButton}
            onPress={handleToggleSave}
          >
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              style={[styles.saveIcon, isSaved && styles.saveIconActive]}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      {'uid' in post ? (
        <ReportDialog
          visible={reportVisible}
          targetType="publication"
          targetId={post.id}
          targetOwnerUid={post.uid}
          onClose={() => setReportVisible(false)}
        />
      ) : null}
    </View>
  );
}

function formatCreatedAt(createdAt: Publication['createdAt'] | Post['createdAt']) {
  if (createdAt instanceof Date) {
    return createdAt.toLocaleDateString();
  }

  return createdAt ?? '';
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#dce3dd',
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
  },
  cardPressed: {
    opacity: 0.82,
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  header: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 10,
  },
  headerPressed: {
    opacity: 0.7,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: '#20352b',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 36,
  },
  avatarImage: {
    height: '100%',
    width: '100%',
  },
  authorBlock: {
    flex: 1,
  },
  author: {
    color: '#17211b',
    fontSize: 14,
    fontWeight: '700',
  },
  meta: {
    color: '#65736a',
    fontSize: 12,
    marginTop: 2,
  },
  title: {
    color: '#111814',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  body: {
    color: '#3d4a42',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
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
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    borderTopColor: '#edf1ee',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 16,
    marginTop: 14,
    paddingTop: 12,
  },
  footerItem: {
    color: '#526057',
    fontSize: 13,
    fontWeight: '600',
  },
  saveButton: {
    alignItems: 'center',
    height: 30,
    justifyContent: 'center',
    marginLeft: 'auto',
    width: 30,
  },
  saveIcon: {
    color: '#526057',
    fontSize: 20,
  },
  saveIconActive: {
    color: '#20352b',
  },
});
