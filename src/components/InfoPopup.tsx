import {Ionicons} from '@expo/vector-icons';
import type {ReactNode} from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type InfoPopupProps = {
  visible: boolean;
  title: string;
  body?: string;
  children?: ReactNode;
  onClose: () => void;
};

export function InfoPopup({visible, title, body, children, onClose}: InfoPopupProps) {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable accessibilityLabel="Cerrar" style={styles.backdrop} onPress={onClose} />
        <View style={styles.popup}>
          <TouchableOpacity
            accessibilityLabel="Cerrar"
            activeOpacity={0.8}
            style={styles.closeButton}
            onPress={onClose}
          >
            <Ionicons name="close" style={styles.closeIcon} />
          </TouchableOpacity>

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.title}>{title}</Text>
            {body ? <Text style={styles.body}>{body}</Text> : null}
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    padding: 20,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  backdrop: {
    backgroundColor: 'rgba(10, 16, 13, 0.45)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  popup: {
    backgroundColor: '#ffffff',
    borderColor: '#dce3dd',
    borderRadius: 8,
    borderWidth: 1,
    maxHeight: '90%',
    maxWidth: 420,
    padding: 18,
    paddingRight: 54,
    position: 'relative',
    width: '100%',
  },
  content: {
    paddingRight: 4,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: '#f3f6f4',
    borderRadius: 8,
    height: 34,
    justifyContent: 'center',
    position: 'absolute',
    right: 12,
    top: 12,
    width: 34,
    zIndex: 1,
  },
  closeIcon: {
    color: '#20352b',
    fontSize: 19,
  },
  title: {
    color: '#111814',
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 25,
  },
  body: {
    color: '#526057',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
});
