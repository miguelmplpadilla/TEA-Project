import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Post } from '@/types/post';

type PostCardProps = {
  post: Post;
};

export function PostCard({ post }: PostCardProps) {
  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{post.author.charAt(0)}</Text>
        </View>

        <View style={styles.authorBlock}>
          <Text style={styles.author}>{post.author}</Text>
          <Text style={styles.meta}>
            {post.handle} · {post.createdAt}
          </Text>
          
        </View>
      </View>

      <Text style={styles.title}>{post.title}</Text>
      <Text style={styles.body}>{post.body}</Text>

      <View style={styles.tags}>
        {post.tags.map((tag) => (
          <View key={tag} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerItem}>{post.score} votos</Text>
        <Text style={styles.footerItem}>{post.commentCount} respuestas</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#dce3dd',
    borderRadius: 8,
    borderWidth: 1,
    padding: 16
  },
  cardPressed: {
    opacity: 0.82
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: '#20352b',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700'
  },
  authorBlock: {
    flex: 1
  },
  author: {
    color: '#17211b',
    fontSize: 14,
    fontWeight: '700'
  },
  meta: {
    color: '#65736a',
    fontSize: 12,
    marginTop: 2
  },
  title: {
    color: '#111814',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24
  },
  body: {
    color: '#3d4a42',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14
  },
  tag: {
    backgroundColor: '#eef3ef',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  tagText: {
    color: '#405348',
    fontSize: 12,
    fontWeight: '600'
  },
  footer: {
    borderTopColor: '#edf1ee',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 16,
    marginTop: 14,
    paddingTop: 12
  },
  footerItem: {
    color: '#526057',
    fontSize: 13,
    fontWeight: '600'
  }
});
