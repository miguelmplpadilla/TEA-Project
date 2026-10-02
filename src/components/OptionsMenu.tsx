import {Ionicons} from '@expo/vector-icons';
import type {ComponentProps} from 'react';
import {useState} from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  type StyleProp,
  TouchableOpacity,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export type OptionsMenuAction = {
  id: string;
  label: string;
  icon?: IoniconName;
  tone?: 'default' | 'danger';
  disabled?: boolean;
  onPress: () => void;
};

type OptionsMenuProps = {
  actions: OptionsMenuAction[];
  accessibilityLabel?: string;
  triggerStyle?: StyleProp<ViewStyle>;
  iconStyle?: StyleProp<TextStyle>;
};

export function OptionsMenu({
  actions,
  accessibilityLabel = 'Abrir opciones',
  triggerStyle,
  iconStyle,
}: OptionsMenuProps) {
  const [visible, setVisible] = useState(false);

  function runAction(action: OptionsMenuAction) {
    setVisible(false);
    action.onPress();
  }

  return (
    <>
      <TouchableOpacity
        accessibilityLabel={accessibilityLabel}
        activeOpacity={0.8}
        style={[styles.trigger, triggerStyle]}
        onPress={() => setVisible(true)}
      >
        <Ionicons name="ellipsis-vertical" style={[styles.triggerIcon, iconStyle]} />
      </TouchableOpacity>

      <Modal animationType="fade" transparent visible={visible} onRequestClose={() => setVisible(false)}>
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={() => setVisible(false)} />
          <ScrollView
            contentContainerStyle={styles.menuContent}
            showsVerticalScrollIndicator={false}
            style={styles.menu}
          >
            {actions.map((action) => (
              <TouchableOpacity
                key={action.id}
                activeOpacity={0.78}
                disabled={action.disabled}
                style={[styles.action, action.disabled && styles.disabledAction]}
                onPress={() => runAction(action)}
              >
                {action.icon ? (
                  <Ionicons
                    name={action.icon}
                    style={[
                      styles.actionIcon,
                      action.tone === 'danger' && styles.dangerText,
                    ]}
                  />
                ) : null}
                <Text
                  style={[
                    styles.actionText,
                    action.tone === 'danger' && styles.dangerText,
                  ]}
                >
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    alignItems: 'center',
    backgroundColor: '#f4f6f3',
    borderColor: '#dce3dd',
    borderRadius: 8,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  triggerIcon: {
    color: '#20352b',
    fontSize: 20,
  },
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
    backgroundColor: 'rgba(10, 16, 13, 0.36)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  menu: {
    backgroundColor: '#ffffff',
    borderColor: '#dce3dd',
    borderRadius: 8,
    borderWidth: 1,
    maxHeight: '80%',
    maxWidth: 320,
    overflow: 'hidden',
    width: '100%',
  },
  menuContent: {
    flexGrow: 0,
  },
  action: {
    alignItems: 'center',
    borderBottomColor: '#edf1ee',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 52,
    paddingHorizontal: 16,
  },
  disabledAction: {
    opacity: 0.45,
  },
  actionIcon: {
    color: '#20352b',
    fontSize: 19,
  },
  actionText: {
    color: '#20352b',
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  dangerText: {
    color: '#a33b30',
  },
});
