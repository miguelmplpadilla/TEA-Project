import {useCallback, useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {Ionicons} from "@expo/vector-icons";
import {router, useFocusEffect, usePathname} from 'expo-router';

import {getFirebaseAuth} from '@/services/firebase';
import {getUnreadActivityCount} from '@/services/users';

export function FooterApp() {
  const [unreadActivityCount, setUnreadActivityCount] = useState(0);
  const pathname = usePathname();
  const shouldShowActivityBadge =
    pathname !== '/Replies' &&
    pathname !== '/FriendRequests' &&
    unreadActivityCount > 0;

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadUnreadRepliesCount() {
        const authUser = getFirebaseAuth().currentUser;

        if (!authUser) {
          setUnreadActivityCount(0);
          return;
        }

        try {
          const nextUnreadActivityCount = await getUnreadActivityCount(authUser.uid);

          if (isActive) {
            setUnreadActivityCount(nextUnreadActivityCount);
          }
        } catch {
          if (isActive) {
            setUnreadActivityCount(0);
          }
        }
      }

      loadUnreadRepliesCount();

      return () => {
        isActive = false;
      };
    }, []),
  );

  return (
    <View pointerEvents="box-none" style={styles.overlay}>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerButton}
                          onPress={() => router.push('/')}>
          <Ionicons name="home" style={styles.footerButtonText}></Ionicons>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.footerButton}
          onPress={() => router.push('/Replies')}
        >
          <Ionicons name="heart" style={styles.footerButtonText}></Ionicons>
          {shouldShowActivityBadge ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadActivityCount > 99 ? '99+' : unreadActivityCount}
              </Text>
            </View>
          ) : null}
        </TouchableOpacity>

        <TouchableOpacity style={styles.footerPostButton}
                          onPress={() => router.push('/Publish')}>
          <Ionicons name="add" style={styles.footerButtonText}></Ionicons>
        </TouchableOpacity>

        <TouchableOpacity style={styles.footerButton}>
          <Ionicons name="send" style={styles.footerButtonText}></Ionicons>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerButton}
                          onPress={() => router.push('/Profile')}>
          <Ionicons name="person" style={styles.footerButtonText}></Ionicons>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    position: 'relative',
  },

  footerPostButton: {
    flex: 1,
    height: 44,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#444',
    alignItems: 'center',
    justifyContent: 'center',
  },

  footerButtonText: {
    color: 'white',
    fontWeight: 'bold',
    tintColor: 'white',
    textAlign: 'center',
    fontSize: 20
  },
  badge: {
    alignItems: 'center',
    backgroundColor: '#c73b33',
    borderColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    minWidth: 20,
    paddingHorizontal: 5,
    paddingVertical: 1,
    position: 'absolute',
    right: 8,
    top: 4,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 14,
  },
});
