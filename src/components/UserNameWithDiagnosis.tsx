import {useEffect, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {DiagnosisBadge} from '@/components/DiagnosisBadge';
import {
  defaultTeaDiagnosis,
  type TeaDiagnosis,
} from '@/constants/teaDiagnosis';
import {getUserById} from '@/services/users';

type UserNameWithDiagnosisProps = {
  userName: string;
  teaDiagnosis?: TeaDiagnosis | null;
  uid?: string;
  size?: 'small' | 'normal' | 'large';
  nameStyle?: object;
};

export function UserNameWithDiagnosis({
  userName,
  teaDiagnosis,
  uid,
  size = 'normal',
  nameStyle,
}: UserNameWithDiagnosisProps) {
  const [loadedDiagnosis, setLoadedDiagnosis] = useState<TeaDiagnosis | null>(teaDiagnosis ?? null);
  const diagnosis = loadedDiagnosis ?? defaultTeaDiagnosis;
  useEffect(() => {
    let isActive = true;

    if (teaDiagnosis) {
      setLoadedDiagnosis(teaDiagnosis);
      return;
    }

    if (!uid) {
      setLoadedDiagnosis(null);
      return;
    }

    const currentUid = uid;

    async function loadDiagnosis() {
      const profile = await getUserById(currentUid);

      if (isActive) {
        setLoadedDiagnosis(profile?.teaDiagnosis ?? null);
      }
    }

    loadDiagnosis();

    return () => {
      isActive = false;
    };
  }, [teaDiagnosis, uid]);

  return (
    <View style={styles.wrap}>
      <Text style={nameStyle}>{`@${userName}`}</Text>
      <DiagnosisBadge diagnosis={diagnosis} size={size} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
});
