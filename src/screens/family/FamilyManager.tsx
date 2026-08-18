import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFamilyStore } from '../../store/useFamilyStore';
import { Chip } from '../../components/Chip';
import { Avatar } from '../../components/Avatar';
import { PillButton } from '../../components/PillButton';
import { colors, spacing, typography, radius, fontFamily } from '../../theme';
import { AgeGroup } from '../../types';
import * as Haptics from 'expo-haptics';

// Shared between onboarding (FamilySetupScreen) and the Settings tab,
// so add/edit/remove logic only lives in one place.
export function FamilyManager() {
  const members = useFamilyStore((s) => s.members);
  const addMember = useFamilyStore((s) => s.addMember);
  const removeMember = useFamilyStore((s) => s.removeMember);

  const [name, setName] = useState('');
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('toddler');

  const handleAdd = () => {
    if (!name.trim()) return;
    addMember(name, ageGroup);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setName('');
  };

  return (
    <View>
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Name (e.g. Mia)"
          placeholderTextColor={colors.textSecondary}
          value={name}
          onChangeText={setName}
        />
        <View style={styles.row}>
          <Chip label="Toddler" selected={ageGroup === 'toddler'} onPress={() => setAgeGroup('toddler')} />
          <Chip label="Adult" selected={ageGroup === 'adult'} onPress={() => setAgeGroup('adult')} />
        </View>
        <PillButton label="+ Add Member" onPress={handleAdd} disabled={!name.trim()} style={{ marginTop: spacing.sm }} />
      </View>

      {members.map((m) => (
        <View key={m.id} style={styles.memberRow}>
          <Avatar name={m.name} ageGroup={m.ageGroup} size={40} />
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text style={styles.memberName}>{m.name}</Text>
            <Text style={typography.small}>{m.ageGroup === 'toddler' ? 'Toddler' : 'Adult'}</Text>
          </View>
          <TouchableOpacity onPress={() => removeMember(m.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="trash-outline" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  form: { backgroundColor: colors.surfaceMint, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.lg },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: fontFamily.mono,
    marginBottom: spacing.md,
    color: colors.textPrimary,
  },
  row: { flexDirection: 'row', marginBottom: spacing.sm },
  memberName: { fontSize: 14, fontFamily: fontFamily.monoBold, color: colors.textPrimary },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
});
