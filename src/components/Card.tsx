import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors, radius, spacing } from '../theme';

export function Card({ children, style, tint = false }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; tint?: boolean }) {
  return <View style={[styles.card, tint && { backgroundColor: colors.surfaceMint }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
});
