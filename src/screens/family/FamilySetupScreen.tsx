import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FamilyManager } from './FamilyManager';
import { useFamilyStore } from '../../store/useFamilyStore';
import { PillButton } from '../../components/PillButton';
import { colors, spacing, typography } from '../../theme';

export function FamilySetupScreen() {
  const members = useFamilyStore((s) => s.members);
  const completeOnboarding = useFamilyStore((s) => s.completeOnboarding);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.banner}>
          <Ionicons name="restaurant" size={40} color={colors.primary} />
        </View>
        <Text style={typography.h1}>WHO ARE WE{'\n'}PLANNING FOR?</Text>
        <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm, marginBottom: spacing.lg }]}>
          Add your family members. You can always edit this later in Settings.
        </Text>

        <FamilyManager />

        <PillButton label="Start Planning" onPress={completeOnboarding} disabled={members.length === 0} style={{ marginTop: spacing.lg }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingTop: spacing.xl },
  banner: {
    height: 120,
    borderRadius: 24,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
});
