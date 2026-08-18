import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, fontFamily } from '../theme';

// The small "MET" / "UNMET" pill used throughout the Goals screen.
export function Badge({ met }: { met: boolean }) {
  return (
    <View style={[styles.badge, { backgroundColor: met ? colors.metBg : colors.unmetBg }]}>
      <Text style={[styles.label, { color: met ? colors.metText : colors.unmetText }]}>{met ? 'Met' : 'Unmet'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill, alignSelf: 'flex-start' },
  label: { fontSize: 10, fontFamily: fontFamily.monoBold, letterSpacing: 0.6, textTransform: 'uppercase' },
});
