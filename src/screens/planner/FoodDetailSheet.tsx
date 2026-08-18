import React, { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BottomSheetModal, BottomSheetView, BottomSheetScrollView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { useFoodStore } from '../../store/useFoodStore';
import { PillButton } from '../../components/PillButton';
import { Chip } from '../../components/Chip';
import { colors, spacing, typography, radius } from '../../theme';
import { FoodEntry } from '../../types';
import { NUTRIENT_META } from '../../constants';

export interface FoodDetailSheetHandle {
  open: (entry: FoodEntry, onRemove: () => void) => void;
}

// Real bottom sheet for viewing a recipe or removing a food from a meal —
// upgraded from the old FoodDetailModal the same way as the picker.
export const FoodDetailSheet = forwardRef<FoodDetailSheetHandle, {}>((_props, ref) => {
  const sheetRef = useRef<BottomSheetModal>(null);
  const foods = useFoodStore((s) => s.foods);

  const [entry, setEntry] = useState<FoodEntry | null>(null);
  const onRemoveRef = useRef<() => void>(() => {});

  const snapPoints = useMemo(() => ['45%', '80%'], []);

  useImperativeHandle(ref, () => ({
    open: (e, onRemove) => {
      setEntry(e);
      onRemoveRef.current = onRemove;
      sheetRef.current?.present();
    },
  }));

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.35} pressBehavior="close" />
    ),
    []
  );

  const food = entry?.source === 'library' ? foods.find((f) => f.id === entry.foodId) : undefined;
  const name = food?.name ?? entry?.adhoc?.name ?? 'Food';
  const nutrients = food?.nutrients ?? entry?.adhoc?.nutrients ?? [];
  const recipe = food?.recipe;

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      index={0}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={styles.handleIndicator}
      backgroundStyle={styles.sheetBackground}
    >
      <BottomSheetView style={styles.content}>
        <Text style={typography.h2}>{name}</Text>

        <View style={styles.chipRow}>
          {nutrients.map((n) => (
            <Chip key={n} label={NUTRIENT_META[n].label} selected selectedColor={NUTRIENT_META[n].color} />
          ))}
        </View>

        {recipe ? (
          <BottomSheetScrollView style={styles.recipeScroll} contentContainerStyle={{ paddingBottom: spacing.md }}>
            {recipe.prepTimeMinutes != null && (
              <Text style={[typography.small, { marginBottom: spacing.sm }]}>⏱ {recipe.prepTimeMinutes} min</Text>
            )}
            <Text style={typography.label}>INGREDIENTS</Text>
            {recipe.ingredients.map((ing, i) => (
              <Text key={i} style={[typography.body, { marginTop: 4 }]}>
                • {ing.qty} {ing.name}
              </Text>
            ))}
            <Text style={[typography.label, { marginTop: spacing.md }]}>STEPS</Text>
            {recipe.steps.map((step, i) => (
              <Text key={i} style={[typography.body, { marginTop: 4 }]}>
                {i + 1}. {step}
              </Text>
            ))}
          </BottomSheetScrollView>
        ) : (
          <Text style={[typography.small, { marginTop: spacing.md }]}>No recipe added for this food yet.</Text>
        )}

        <PillButton
          label="Remove from this meal"
          variant="outline"
          onPress={() => {
            onRemoveRef.current();
            sheetRef.current?.dismiss();
          }}
          style={{ marginTop: spacing.lg }}
        />
        <PillButton label="Close" variant="secondary" onPress={() => sheetRef.current?.dismiss()} style={{ marginTop: spacing.sm, marginBottom: spacing.lg }} />
      </BottomSheetView>
    </BottomSheetModal>
  );
});

FoodDetailSheet.displayName = 'FoodDetailSheet';

const styles = StyleSheet.create({
  sheetBackground: { backgroundColor: colors.background, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl },
  handleIndicator: { backgroundColor: colors.border, width: 40 },
  content: { flex: 1, paddingHorizontal: spacing.lg },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.sm },
  recipeScroll: { flex: 1, marginTop: spacing.md },
});
