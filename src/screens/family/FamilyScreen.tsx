import React from 'react';
import { Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FamilyManager } from './FamilyManager';
import { colors, spacing, typography } from '../../theme';

export function FamilyScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={typography.h1}>Settings</Text>
        <Text style={[typography.body, { color: colors.textSecondary, marginTop: 4, marginBottom: spacing.lg }]}>
          Manage who you're planning meals for.
        </Text>
        <FamilyManager />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
});
