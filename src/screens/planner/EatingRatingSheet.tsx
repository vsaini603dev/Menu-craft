import React, { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, fontFamily } from '../../theme';
import { EATING_RATING_OPTIONS, RATING_META } from '../../constants';
import { EatingRating, FamilyMember } from '../../types';
import * as Haptics from 'expo-haptics';

export interface EatingRatingSheetHandle {
  open: (member: FamilyMember, currentRating: EatingRating | undefined, onSelect: (rating: EatingRating | undefined) => void) => void;
}

// The selected rating stays on MealAssignment alongside the meal's foods,
// day, and type. That keeps future trend and food-preference reporting a
// query over existing plan data instead of requiring a separate event store.
export const EatingRatingSheet = forwardRef<EatingRatingSheetHandle, {}>((_props, ref) => {
  const sheetRef = useRef<BottomSheetModal>(null);
  const [member, setMember] = useState<FamilyMember | null>(null);
  const [currentRating, setCurrentRating] = useState<EatingRating | undefined>();
  const onSelectRef = useRef<(rating: EatingRating | undefined) => void>(() => {});
  const snapPoints = useMemo(() => ['58%'], []);

  useImperativeHandle(ref, () => ({
    open: (familyMember, rating, onSelect) => {
      setMember(familyMember);
      setCurrentRating(rating);
      onSelectRef.current = onSelect;
      sheetRef.current?.present();
    },
  }));

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.35} pressBehavior="close" />
    ),
    []
  );

  const selectRating = (rating: EatingRating | undefined) => {
    onSelectRef.current(rating);
    Haptics.selectionAsync();
    sheetRef.current?.dismiss();
  };

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
        <Text style={typography.h2}>Meal outcome</Text>
        <Text style={[typography.small, styles.description]}>How much did {member?.name ?? 'they'} eat?</Text>

        <View style={styles.options}>
          {EATING_RATING_OPTIONS.map((rating) => {
            const selected = rating === currentRating;
            const meta = RATING_META[rating];
            return (
              <TouchableOpacity key={rating} onPress={() => selectRating(rating)} style={[styles.option, selected && styles.optionSelected]}>
                <View style={styles.optionText}>
                  <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>{meta.label}</Text>
                  <Text style={styles.optionDescription}>{meta.description}</Text>
                </View>
                <Ionicons name={selected ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={selected ? colors.primary : colors.textSecondary} />
              </TouchableOpacity>
            );
          })}
        </View>

        {currentRating && (
          <TouchableOpacity onPress={() => selectRating(undefined)} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear meal outcome</Text>
          </TouchableOpacity>
        )}
      </BottomSheetView>
    </BottomSheetModal>
  );
});

EatingRatingSheet.displayName = 'EatingRatingSheet';

const styles = StyleSheet.create({
  sheetBackground: { backgroundColor: colors.background, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl },
  handleIndicator: { backgroundColor: colors.border, width: 40 },
  content: { flex: 1, paddingHorizontal: spacing.lg },
  description: { marginTop: spacing.xs, marginBottom: spacing.md },
  options: { borderTopWidth: 1, borderTopColor: colors.border },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  optionSelected: { backgroundColor: colors.primarySoft, marginHorizontal: -spacing.sm, paddingHorizontal: spacing.sm },
  optionText: { flex: 1, marginRight: spacing.md },
  optionLabel: { fontSize: 14, fontFamily: fontFamily.monoBold, color: colors.textPrimary },
  optionLabelSelected: { color: colors.primary },
  optionDescription: { fontSize: 11, color: colors.textSecondary, marginTop: 3 },
  clearButton: { alignSelf: 'center', paddingVertical: spacing.md },
  clearButtonText: { fontSize: 11, fontFamily: fontFamily.monoBold, textTransform: 'uppercase', letterSpacing: 0.5, color: colors.textSecondary },
});
