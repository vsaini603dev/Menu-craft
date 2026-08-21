import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFamilyStore } from '../../store/useFamilyStore';
import { useFoodStore } from '../../store/useFoodStore';
import { useWeekPlanStore } from '../../store/useWeekPlanStore';
import { useGoalsFor } from '../../store/useGoalsStore';
import { Avatar } from '../../components/Avatar';
import { NutritionHUD } from './NutritionHUD';
import { MealSection } from './MealSection';
import { FoodPickerSheet, FoodPickerSheetHandle } from './FoodPickerSheet';
import { FoodDetailSheet, FoodDetailSheetHandle } from './FoodDetailSheet';
import { EatingRatingSheet, EatingRatingSheetHandle } from './EatingRatingSheet';
import { getWeekId, getWeekDates, addWeeks, formatWeekRangeLabel, isCurrentWeek, DAY_LABELS } from '../../lib/week';
import { validateWeek } from '../../lib/validateWeek';
import { colors, spacing, typography, radius, fontFamily } from '../../theme';
import { MEAL_TYPES } from '../../constants';
import { MealType } from '../../types';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function PlannerScreen() {
  const members = useFamilyStore((s) => s.members);
  const foods = useFoodStore((s) => s.foods);
  const getPlan = useWeekPlanStore((s) => s.getPlan);
  const addFood = useWeekPlanStore((s) => s.addFood);
  const removeFood = useWeekPlanStore((s) => s.removeFood);
  const setEatingRating = useWeekPlanStore((s) => s.setEatingRating);
  const copyDay = useWeekPlanStore((s) => s.copyDay);

  const [weekOffset, setWeekOffset] = useState(0);
  const weekId = useMemo(() => addWeeks(getWeekId(), weekOffset), [weekOffset]);
  const weekDates = useMemo(() => getWeekDates(weekId), [weekId]);
  const storedPlan = useWeekPlanStore((s) => s.plans[weekId]);
  const plan = storedPlan ?? getPlan(weekId);

  const [activeDay, setActiveDay] = useState(0);
  const [copiedDay, setCopiedDay] = useState<{ weekId: string; day: number } | null>(null);
  const [activeMemberId, setActiveMemberId] = useState(members[0]?.id ?? '');
  const [hudExpanded, setHudExpanded] = useState(true);
  const listRef = useRef<FlatList>(null);

  const pickerRef = useRef<FoodPickerSheetHandle>(null);
  const detailRef = useRef<FoodDetailSheetHandle>(null);
  const eatingRatingRef = useRef<EatingRatingSheetHandle>(null);

  const activeMember = members.find((m) => m.id === activeMemberId) ?? members[0];
  const activeGoals = useGoalsFor(activeMember?.id ?? '');
  const validation = activeMember ? validateWeek(plan, activeMember.id, foods, activeGoals) : null;
  const activeDayHasMeals = plan.slots.some(
    (slot) => slot.day === activeDay && slot.assignments.some((assignment) => assignment.foods.length > 0)
  );

  const goToDay = (index: number) => {
    setActiveDay(index);
    listRef.current?.scrollToIndex({ index, animated: true });
    Haptics.selectionAsync();
  };

  const changeWeek = (delta: number) => {
    setWeekOffset((prev) => prev + delta);
    setActiveDay(0);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (index !== activeDay) {
      setActiveDay(index);
      Haptics.selectionAsync();
    }
  };

  const copyActiveDay = () => {
    setCopiedDay({ weekId, day: activeDay });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const pasteCopiedDay = () => {
    if (copiedDay == null || (copiedDay.weekId === weekId && copiedDay.day === activeDay)) return;

    const targetHasMeals = plan.slots.some(
      (slot) => slot.day === activeDay && slot.assignments.some((assignment) => assignment.foods.length > 0)
    );
    const paste = () => {
      copyDay(copiedDay.weekId, copiedDay.day, weekId, activeDay);
      setCopiedDay(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    if (targetHasMeals) {
      Alert.alert(
        `Replace ${DAY_LABELS[activeDay]}?`,
        `Pasting ${DAY_LABELS[copiedDay.day]}'s meals will replace all meals currently planned for ${DAY_LABELS[activeDay]}.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Paste and replace', style: 'destructive', onPress: paste },
        ]
      );
      return;
    }

    paste();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Text style={styles.appTitle}>MEAL CRAFT</Text>
      </View>

      <View style={styles.weekHeader}>
        <TouchableOpacity onPress={() => changeWeek(-1)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={typography.h2}>{isCurrentWeek(weekId) ? 'This Week' : formatWeekRangeLabel(weekId)}</Text>
          {!isCurrentWeek(weekId) && (
            <TouchableOpacity onPress={() => setWeekOffset(0)}>
              <Text style={styles.backToWeek}>Back to this week</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity onPress={() => changeWeek(1)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-forward" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.dayRow}
        contentContainerStyle={{ paddingHorizontal: spacing.lg }}
      >
        {weekDates.map((date, i) => {
          const isToday = date.toDateString() === new Date().toDateString();
          return (
            <TouchableOpacity key={i} onPress={() => goToDay(i)} style={[styles.dayPill, activeDay === i && styles.dayPillActive]}>
              <Text style={[styles.dayLabel, activeDay === i && styles.dayLabelActive]}>{DAY_LABELS[i]}</Text>
              <Text style={[styles.dayNum, isToday && !( activeDay === i) && { color: colors.today }, activeDay === i && styles.dayLabelActive]}>
                {date.getDate()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.dayActions}>
        {copiedDay == null ? (
          <TouchableOpacity
            onPress={copyActiveDay}
            disabled={!activeDayHasMeals}
            style={[styles.dayActionButton, !activeDayHasMeals && styles.dayActionButtonDisabled]}
          >
            <Ionicons name="copy-outline" size={14} color={activeDayHasMeals ? colors.primary : colors.textSecondary} />
            <Text style={[styles.dayActionText, !activeDayHasMeals && styles.dayActionTextDisabled]}>Copy {DAY_LABELS[activeDay]}</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity onPress={() => setCopiedDay(null)} style={styles.dayActionButton}>
              <Ionicons name="close" size={14} color={colors.textSecondary} />
              <Text style={styles.dayActionText}>{DAY_LABELS[copiedDay.day]} copied</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={pasteCopiedDay}
              disabled={copiedDay.weekId === weekId && copiedDay.day === activeDay}
              style={[styles.dayActionButton, (copiedDay.weekId !== weekId || copiedDay.day !== activeDay) && styles.pasteButton, copiedDay.weekId === weekId && copiedDay.day === activeDay && styles.dayActionButtonDisabled]}
            >
              <Ionicons name="clipboard-outline" size={14} color={copiedDay.weekId === weekId && copiedDay.day === activeDay ? colors.textSecondary : colors.textOnPrimary} />
              <Text style={[styles.pasteButtonText, copiedDay.weekId === weekId && copiedDay.day === activeDay && styles.dayActionTextDisabled]}>Paste to {DAY_LABELS[activeDay]}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {members.length === 0 ? (
        <View style={{ padding: spacing.lg }}>
          <Text style={typography.body}>Add a family member in the Settings tab to start planning.</Text>
        </View>
      ) : (
        <>
          <View style={styles.hudSection}>
            <TouchableOpacity onPress={() => setHudExpanded((e) => !e)} style={styles.hudToggle}>
              <Text style={styles.hudToggleLabel}>Weekly Goals</Text>
              <Ionicons name={hudExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textSecondary} />
            </TouchableOpacity>
            {hudExpanded && validation && activeMember && (
              <View style={styles.hudCard}>
                <View style={styles.goalsMemberRow}>
                  <Text style={styles.goalsMemberLabel}>GOALS FOR</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.goalsMemberScroll} contentContainerStyle={styles.goalsMemberList}>
                    {members.map((member) => (
                      <TouchableOpacity
                        key={member.id}
                        onPress={() => {
                          setActiveMemberId(member.id);
                          Haptics.selectionAsync();
                        }}
                        style={styles.goalsMemberButton}
                      >
                        <Avatar name={member.name} ageGroup={member.ageGroup} size={28} selected={member.id === activeMemberId} />
                        <Text style={[styles.goalsMemberName, member.id === activeMemberId && styles.goalsMemberNameSelected]} numberOfLines={1}>
                          {member.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                <NutritionHUD validation={validation} goals={activeGoals} />
              </View>
            )}
          </View>

          <FlatList
            ref={listRef}
            style={styles.calendar}
            data={weekDates}
            keyExtractor={(_, i) => String(i)}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            getItemLayout={(_, index) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * index, index })}
            onMomentumScrollEnd={handleScrollEnd}
            renderItem={({ index }) => (
              <ScrollView style={{ width: SCREEN_WIDTH }} contentContainerStyle={styles.dayPage}>
                {MEAL_TYPES.map((mt) => (
                  <MealSection
                    key={mt.key}
                    day={index}
                    mealType={mt.key}
                    members={members}
                    plan={plan}
                    foods={foods}
                    onAddPress={(familyMemberId) => {
                      const member = members.find((m) => m.id === familyMemberId);
                      if (!member) return;
                      const slot = plan.slots.find((candidate) => candidate.day === index && candidate.mealType === mt.key);
                      const prioritizedFoodIds = (slot?.assignments ?? [])
                        .filter((assignment) => assignment.familyMemberId !== familyMemberId)
                        .flatMap((assignment) => assignment.foods)
                        .filter((entry) => entry.source === 'library' && !!entry.foodId)
                        .map((entry) => entry.foodId!);
                      pickerRef.current?.open(
                        member,
                        (entry) => addFood(weekId, index, mt.key, familyMemberId, entry),
                        prioritizedFoodIds
                      );
                    }}
                    onChipPress={(familyMemberId, entry) => {
                      detailRef.current?.open(entry, () => removeFood(weekId, index, mt.key, familyMemberId, entry.id));
                    }}
                    onRemove={(familyMemberId, entryId) => {
                      removeFood(weekId, index, mt.key, familyMemberId, entryId);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    onRatingPress={(familyMemberId, rating) => {
                      const member = members.find((candidate) => candidate.id === familyMemberId);
                      if (!member) return;
                      eatingRatingRef.current?.open(member, rating, (newRating) => {
                        setEatingRating(weekId, index, mt.key, familyMemberId, newRating);
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      });
                    }}
                  />
                ))}
              </ScrollView>
            )}
          />
        </>
      )}

      <FoodPickerSheet ref={pickerRef} />
      <FoodDetailSheet ref={detailRef} />
      <EatingRatingSheet ref={eatingRatingRef} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.md },
  appTitle: { fontSize: 17, fontFamily: fontFamily.monoBold, letterSpacing: 1, color: colors.textPrimary },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  backToWeek: { fontSize: 10, fontFamily: fontFamily.monoBold, letterSpacing: 0.6, textTransform: 'uppercase', color: colors.primary, marginTop: 4 },
  dayRow: { flexGrow: 0, marginBottom: spacing.md },
  dayPill: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginRight: 6,
  },
  dayPillActive: { backgroundColor: colors.primary },
  dayLabel: { fontSize: 10, fontFamily: fontFamily.mono, letterSpacing: 0.5, color: colors.textSecondary },
  dayLabelActive: { color: colors.textOnPrimary },
  dayNum: { fontSize: 17, fontFamily: fontFamily.monoBold, color: colors.textPrimary, marginTop: 3 },
  dayActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  dayActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  dayActionText: { fontSize: 10, fontFamily: fontFamily.monoBold, letterSpacing: 0.4, textTransform: 'uppercase', color: colors.primary },
  pasteButton: { backgroundColor: colors.primary, borderColor: colors.primary },
  pasteButtonText: { fontSize: 10, fontFamily: fontFamily.monoBold, letterSpacing: 0.4, textTransform: 'uppercase', color: colors.textOnPrimary },
  dayActionButtonDisabled: { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
  dayActionTextDisabled: { color: colors.textSecondary },
  hudSection: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  hudToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  hudToggleLabel: { fontSize: 11, fontFamily: fontFamily.monoBold, letterSpacing: 0.5, textTransform: 'uppercase', color: colors.textSecondary },
  hudCard: { backgroundColor: colors.surfaceMint, borderRadius: radius.lg, padding: spacing.lg, marginTop: spacing.sm },
  goalsMemberRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  goalsMemberLabel: { fontSize: 10, fontFamily: fontFamily.monoBold, letterSpacing: 0.6, color: colors.textSecondary, marginRight: spacing.sm },
  goalsMemberScroll: { flex: 1 },
  goalsMemberList: { alignItems: 'center', paddingRight: spacing.sm },
  goalsMemberButton: { alignItems: 'center', marginRight: spacing.md, maxWidth: 54 },
  goalsMemberName: { fontSize: 9, fontFamily: fontFamily.mono, color: colors.textSecondary, marginTop: 3, textAlign: 'center' },
  goalsMemberNameSelected: { color: colors.primary, fontFamily: fontFamily.monoBold },
  // Keep the calendar within the space left by the header and weekly-goals accordion.
  calendar: { flex: 1, minHeight: 0 },
  dayPage: { padding: spacing.lg, paddingTop: spacing.sm },
});
