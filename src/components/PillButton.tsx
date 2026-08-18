import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, Animated } from 'react-native';
import { colors, radius, fontFamily } from '../theme';

interface PillButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export function PillButton({ label, onPress, variant = 'primary', disabled, loading, style }: PillButtonProps) {
  const scale = React.useRef(new Animated.Value(1)).current;
  const bg = variant === 'primary' ? colors.primary : variant === 'secondary' ? colors.surfaceMuted : 'transparent';
  const textColor = variant === 'primary' ? colors.textOnPrimary : colors.textPrimary;
  const borderWidth = variant === 'outline' ? 1.5 : 0;

  const pressIn = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, friction: 6 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 4 }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={disabled || loading}
        activeOpacity={0.85}
        style={[
          styles.btn,
          { backgroundColor: bg, borderWidth, borderColor: colors.border, opacity: disabled ? 0.5 : 1 },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={textColor} />
        ) : (
          <Text style={[styles.label, { color: textColor }]}>{label}</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  btn: { paddingVertical: 15, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 13, fontFamily: fontFamily.monoBold, letterSpacing: 0.8, textTransform: 'uppercase' },
});
