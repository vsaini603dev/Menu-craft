import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { AgeGroup } from '../types';

interface AvatarProps {
  name: string;
  ageGroup: AgeGroup;
  size?: number;
  selected?: boolean;
}

export function Avatar({ ageGroup, size = 48, selected }: AvatarProps) {
  const bg = ageGroup === 'toddler' ? colors.toddler : colors.adult;
  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
          borderWidth: selected ? 3 : 0,
          borderColor: colors.primary,
        },
      ]}
    >
      <Ionicons name="person" size={size * 0.55} color="#FFFFFF" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
});
