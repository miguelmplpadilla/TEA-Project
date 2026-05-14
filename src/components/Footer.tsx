import {StyleSheet, TouchableOpacity, View} from 'react-native';
import {Ionicons} from "@expo/vector-icons";
import { router } from 'expo-router';

export function FooterApp() {
  return (
    <View pointerEvents="box-none" style={styles.overlay}>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerButton}
                          onPress={() => router.push('/')}>
          <Ionicons name="home" style={styles.footerButtonText}></Ionicons>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerButton}>
          <Ionicons name="heart" style={styles.footerButtonText}></Ionicons>
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
});
