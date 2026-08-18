import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, fontFamily } from '../theme';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  color?: string;
  bgColor?: string;
  selectedColor?: string;
  disabled?: boolean;
}

export function Chip({
  label,
  selected,
  onPress,
  color = colors.tag,
  bgColor = colors.tagBg,
  selectedColor,
  disabled,
}: ChipProps) {
  const bg = selected ? selectedColor ?? colors.primary : bgColor;
  const textColor = selected ? colors.textOnPrimary : color;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || !onPress}
      activeOpacity={0.7}
      style={[styles.chip, { backgroundColor: bg, opacity: disabled ? 0.5 : 1 }]}
    >
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, marginRight: 8, marginBottom: 8 },
  label: { fontSize: 10, fontFamily: fontFamily.monoBold, letterSpacing: 0.6, textTransform: 'uppercase' },
});
