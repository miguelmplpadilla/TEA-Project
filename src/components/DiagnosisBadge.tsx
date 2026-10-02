import {Ionicons} from '@expo/vector-icons';
import {useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';

import {InfoPopup} from '@/components/InfoPopup';
import {
  defaultTeaDiagnosis,
  getTeaDiagnosisColor,
  getTeaDiagnosisLabel,
  teaDiagnosisOptions,
  type TeaDiagnosis,
} from '@/constants/teaDiagnosis';

type DiagnosisBadgeProps = {
  diagnosis?: TeaDiagnosis | null;
  size?: 'small' | 'normal' | 'large';
};

const badgeIconSizes = {
  small: 11,
  normal: 13,
  large: 16,
} as const;

export function DiagnosisBadge({
  diagnosis,
  size = 'normal',
}: DiagnosisBadgeProps) {
  const [popupVisible, setPopupVisible] = useState(false);
  const currentDiagnosis = diagnosis ?? defaultTeaDiagnosis;
  const iconSize = badgeIconSizes[size];

  return (
    <>
      <TouchableOpacity
        accessibilityLabel="Explicar distintivo de diagnostico"
        activeOpacity={0.8}
        style={[
          styles.badge,
          {
            backgroundColor: getTeaDiagnosisColor(currentDiagnosis),
            height: iconSize + 7,
            width: iconSize + 7,
          },
        ]}
        onPress={() => setPopupVisible(true)}
      >
        <Ionicons name="leaf" style={[styles.icon, {fontSize: iconSize}]} />
      </TouchableOpacity>

      <InfoPopup
        visible={popupVisible}
        title="Distintivo de identificacion"
        body="Este icono indica como se identifica la persona con respecto a TEA en su perfil."
        onClose={() => setPopupVisible(false)}
      >
        <View style={styles.currentStatus}>
          <View
            style={[
              styles.popupBadge,
              {backgroundColor: getTeaDiagnosisColor(currentDiagnosis)},
            ]}
          >
            <Ionicons name="leaf" style={styles.popupIcon} />
          </View>
          <View style={styles.currentCopy}>
            <Text style={styles.currentLabel}>Ahora significa</Text>
            <Text style={styles.currentValue}>{getTeaDiagnosisLabel(currentDiagnosis)}</Text>
          </View>
        </View>
        <Text style={styles.note}>
          El gris indica que la persona todavia esta explorando o no ha indicado un diagnostico.
        </Text>
        <View style={styles.legend}>
          {teaDiagnosisOptions.map((option) => (
            <View key={option.value} style={styles.legendRow}>
              <View
                style={[
                  styles.legendDot,
                  {backgroundColor: getTeaDiagnosisColor(option.value)},
                ]}
              />
              <Text style={styles.legendText}>{option.label}</Text>
            </View>
          ))}
        </View>
      </InfoPopup>
    </>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    borderRadius: 999,
    justifyContent: 'center',
  },
  icon: {
    color: '#ffffff',
    fontWeight: '800',
  },
  currentStatus: {
    alignItems: 'center',
    backgroundColor: '#f4f6f3',
    borderColor: '#dce3dd',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    padding: 12,
  },
  popupBadge: {
    alignItems: 'center',
    borderRadius: 999,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  popupIcon: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
  },
  currentCopy: {
    flex: 1,
  },
  currentLabel: {
    color: '#526057',
    fontSize: 12,
    fontWeight: '800',
  },
  currentValue: {
    color: '#17211b',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 2,
  },
  note: {
    color: '#526057',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 10,
  },
  legend: {
    gap: 7,
    marginTop: 12,
  },
  legendRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 8,
  },
  legendDot: {
    borderRadius: 999,
    height: 10,
    marginTop: 4,
    width: 10,
  },
  legendText: {
    color: '#405348',
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
});
