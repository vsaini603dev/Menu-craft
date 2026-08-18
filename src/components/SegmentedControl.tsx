import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing, fontFamily } from '../theme';

interface SegmentedControlProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

// Horizontally scrollable segmented tab bar — used for the Goals screen's
// family-member switcher. Scrolls rather than truncating so it still works
// cleanly whether there's one family member or several.
export function SegmentedControl<T extends string>({ options, value, onChange }: SegmentedControlProps<T>) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.track} contentContainerStyle={styles.trackContent}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[styles.segment, active && styles.segmentActive]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{opt.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  track: { backgroundColor: colors.surfaceMuted, borderRadius: radius.pill, flexGrow: 0 },
  trackContent: { padding: 4 },
  segment: { paddingHorizontal: spacing.lg, paddingVertical: 10, borderRadius: radius.pill },
  segmentActive: { backgroundColor: colors.surface },
  label: { fontSize: 11, fontFamily: fontFamily.monoBold, letterSpacing: 0.6, textTransform: 'uppercase', color: colors.textSecondary },
  labelActive: { color: colors.textPrimary },
});
