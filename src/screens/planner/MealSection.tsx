import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated as RNAnimated } from 'react-native';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../../components/Avatar';
import { colors, spacing, typography, radius, fontFamily } from '../../theme';
import { FamilyMember, WeekPlan, Food, MealType, FoodEntry, EatingRating } from '../../types';
import { MEAL_TYPES, RATING_META } from '../../constants';

interface Props {
  day: number;
  mealType: MealType;
  members: FamilyMember[];
  plan: WeekPlan;
  foods: Food[];
  onAddPress: (familyMemberId: string) => void;
  onChipPress: (familyMemberId: string, entry: FoodEntry) => void;
  onRemove: (familyMemberId: string, entryId: string) => void;
  onRatingChange: (familyMemberId: string, rating: EatingRating | undefined) => void;
}

function resolveLabel(entry: FoodEntry, foods: Food[]): string {
  if (entry.source === 'library') {
    return foods.find((f) => f.id === entry.foodId)?.name ?? 'Deleted food';
  }
  return entry.adhoc?.name ?? 'Custom';
}

// A food chip with its own inline "×" — tapping the label opens the recipe/
// detail sheet, tapping × removes it immediately (no confirmation; trivial
// to re-add if it was a mistake).
function FoodChip({ label, onPress, onRemove }: { label: string; onPress: () => void; onRemove: () => void }) {
  const scale = React.useRef(new RNAnimated.Value(1)).current;
  return (
    <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(120)} layout={Layout.springify().damping(16)}>
      <RNAnimated.View style={[styles.foodChip, { transform: [{ scale }] }]}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={() => RNAnimated.spring(scale, { toValue: 0.96, useNativeDriver: true, friction: 6 }).start()}
          onPressOut={() => RNAnimated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 4 }).start()}
        >
          <Text style={styles.foodChipText}>{label}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onRemove} hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }} style={styles.chipRemove}>
          <Ionicons name="close" size={13} color={colors.textSecondary} />
        </TouchableOpacity>
      </RNAnimated.View>
    </Animated.View>
  );
}

function AddButton({ onPress, compact }: { onPress: () => void; compact: boolean }) {
  if (compact) {
    return (
      <TouchableOpacity onPress={onPress} style={styles.addCircle}>
        <Ionicons name="add" size={16} color="#FFFFFF" />
      </TouchableOpacity>
    );
  }
  return (
    <TouchableOpacity onPress={onPress} style={styles.addRow}>
      <Ionicons name="add" size={14} color={colors.primary} />
      <Text style={styles.addRowText}>Add meal</Text>
    </TouchableOpacity>
  );
}

export function MealSection({ day, mealType, members, plan, foods, onAddPress, onChipPress, onRemove, onRatingChange }: Props) {
  const meta = MEAL_TYPES.find((m) => m.key === mealType)!;
  const slot = plan.slots.find((s) => s.day === day && s.mealType === mealType);

  // Detect a "shared" meal: every family member has the exact same set of
  // foods assigned, so it's rendered as one collapsed row instead of N
  // identical ones. Purely a display simplification over the same per-person
  // data — no schema change, so it degrades gracefully back to per-person
  // rows the moment anyone's plan diverges.
  const sharedLabels = useMemo(() => {
    if (members.length < 2) return null;
    const perMember = members.map((m) => {
      const assignment = slot?.assignments.find((a) => a.familyMemberId === m.id);
      const labels = (assignment?.foods ?? []).map((e) => resolveLabel(e, foods)).sort();
      return labels;
    });
    if (perMember.some((l) => l.length === 0)) return null;
    const first = perMember[0].join('|');
    const allMatch = perMember.every((l) => l.join('|') === first);
    return allMatch ? perMember[0] : null;
  }, [members, slot, foods]);

  const allEmpty = members.every((m) => {
    const assignment = slot?.assignments.find((a) => a.familyMemberId === m.id);
    return !assignment || assignment.foods.length === 0;
  });

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Ionicons name={meta.icon} size={16} color={colors.textPrimary} style={{ marginRight: 8 }} />
        <Text style={typography.h3}>{meta.label.toUpperCase()}</Text>
      </View>

      {allEmpty ? (
        <TouchableOpacity style={styles.emptyState} onPress={() => onAddPress(members[0]?.id)} disabled={!members[0]}>
          <Ionicons name="add" size={16} color={colors.primary} />
          <Text style={styles.emptyStateText}>Plan {meta.label.toLowerCase()}</Text>
        </TouchableOpacity>
      ) : sharedLabels ? (
        <View style={styles.memberRow}>
          <View style={styles.sharedAvatars}>
            {members.slice(0, 2).map((m, i) => (
              <View key={m.id} style={[styles.sharedAvatarWrap, i > 0 && { marginLeft: -14 }]}>
                <Avatar name={m.name} ageGroup={m.ageGroup} size={30} />
              </View>
            ))}
          </View>
          <View style={styles.memberContent}>
            <View style={styles.chipsRow}>
              {slot?.assignments[0]?.foods.map((entry) => (
                <FoodChip
                  key={entry.id}
                  label={resolveLabel(entry, foods)}
                  onPress={() => onChipPress(members[0].id, entry)}
                  onRemove={() => members.forEach((m) => onRemove(m.id, entry.id))}
                />
              ))}
            </View>
            <Text style={styles.sharedLabel}>Shared</Text>
          </View>
        </View>
      ) : (
        members.map((member) => {
          const assignment = slot?.assignments.find((a) => a.familyMemberId === member.id);
          const hasFoods = !!assignment && assignment.foods.length > 0;
          return (
            <View key={member.id} style={styles.memberRow}>
              <Avatar name={member.name} ageGroup={member.ageGroup} size={32} />
              <View style={styles.memberContent}>
                {hasFoods ? (
                  <View style={styles.chipsRow}>
                    {assignment!.foods.map((entry) => (
                      <FoodChip
                        key={entry.id}
                        label={resolveLabel(entry, foods)}
                        onPress={() => onChipPress(member.id, entry)}
                        onRemove={() => onRemove(member.id, entry.id)}
                      />
                    ))}
                    <AddButton compact onPress={() => onAddPress(member.id)} />
                  </View>
                ) : (
                  <AddButton compact={false} onPress={() => onAddPress(member.id)} />
                )}

                {member.trackEatingRating && hasFoods && (
                  <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(120)} style={styles.ratingRow}>
                    {(Object.keys(RATING_META) as EatingRating[]).map((r) => (
                      <TouchableOpacity
                        key={r}
                        onPress={() => onRatingChange(member.id, assignment!.eatingRating === r ? undefined : r)}
                        style={[styles.ratingBtn, assignment!.eatingRating === r && styles.ratingBtnActive]}
                      >
                        <Text style={{ fontSize: 14 }}>{RATING_META[r].emoji}</Text>
                      </TouchableOpacity>
                    ))}
                    {assignment!.eatingRating && (
                      <Text style={styles.ratingLabel}>{RATING_META[assignment!.eatingRating].label}</Text>
                    )}
                  </Animated.View>
                )}
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { backgroundColor: colors.surfaceMint, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  emptyState: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    gap: 6,
  },
  emptyStateText: { fontSize: 12, fontFamily: fontFamily.monoBold, letterSpacing: 0.6, textTransform: 'uppercase', color: colors.primary },
  memberRow: { flexDirection: 'row', marginBottom: spacing.md },
  memberContent: { flex: 1, marginLeft: spacing.md },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  foodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 7,
    marginRight: 6,
    marginBottom: 6,
  },
  foodChipText: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  chipRemove: { marginLeft: 4, padding: 2 },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: radius.md,
    paddingVertical: 12,
    gap: 4,
  },
  addRowText: { fontSize: 11, fontFamily: fontFamily.monoBold, letterSpacing: 0.6, textTransform: 'uppercase', color: colors.primary },
  addCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  sharedAvatars: { flexDirection: 'row' },
  sharedAvatarWrap: { borderWidth: 2, borderColor: colors.surfaceMint, borderRadius: 999 },
  sharedLabel: { fontSize: 10, fontFamily: fontFamily.monoBold, letterSpacing: 0.6, textTransform: 'uppercase', color: colors.textSecondary, marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  ratingBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  ratingBtnActive: { backgroundColor: colors.primaryMuted },
  ratingLabel: { fontSize: 10, fontFamily: fontFamily.monoBold, letterSpacing: 0.6, textTransform: 'uppercase', color: colors.textSecondary, marginLeft: 2 },
});
