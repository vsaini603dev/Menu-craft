import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { colors, radius } from '../theme';

interface ProgressBarProps {
  progress: number; // 0 to 1
  color?: string;
}

export function ProgressBar({ progress, color = colors.primary }: ProgressBarProps) {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(widthAnim, {
      toValue: Math.min(1, Math.max(0, progress)),
      useNativeDriver: false,
      friction: 8,
      tension: 40,
    }).start();
  }, [progress]);

  return (
    <View style={styles.track}>
      <Animated.View
        style={[
          styles.fill,
          {
            backgroundColor: color,
            width: widthAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 7, backgroundColor: colors.surfaceMuted, borderRadius: radius.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill },
});
