import React, { useMemo, useState } from 'react';
import { Text, TouchableOpacity, ScrollView, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFamilyStore } from '../../store/useFamilyStore';
import { useFoodStore } from '../../store/useFoodStore';
import { useWeekPlanStore } from '../../store/useWeekPlanStore';
import { useGoalsStore, useGoalsFor } from '../../store/useGoalsStore';
import { Avatar } from '../../components/Avatar';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { ProgressBar } from '../../components/ProgressBar';
import { SegmentedControl } from '../../components/SegmentedControl';
import { PillButton } from '../../components/PillButton';
import { colors, spacing, typography, radius, fontFamily } from '../../theme';
import { getWeekId } from '../../lib/week';
import { validateWeek } from '../../lib/validateWeek';
import { NUTRIENT_META } from '../../constants';
import { Nutrient } from '../../types';
import * as Haptics from 'expo-haptics';

const NUTRIENTS: Nutrient[] = ['protein', 'calcium', 'vitC', 'iron'];

function Stepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View style={styles.stepper}>
      <TouchableOpacity
        onPress={() => {
          onChange(Math.max(0, value - 1));
          Haptics.selectionAsync();
        }}
        style={styles.stepBtn}
      >
        <Text style={styles.stepBtnText}>−</Text>
      </TouchableOpacity>
      <View style={styles.stepValue}>
        <Text style={typography.h2}>{value}</Text>
      </View>
      <TouchableOpacity
        onPress={() => {
          onChange(value + 1);
          Haptics.selectionAsync();
        }}
        style={styles.stepBtn}
      >
        <Text style={styles.stepBtnText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

export function GoalsScreen() {
  const members = useFamilyStore((s) => s.members);
  const foods = useFoodStore((s) => s.foods);
  const weekId = useMemo(() => getWeekId(), []);
  const plan = useWeekPlanStore((s) => s.plans[weekId]);
  const setNutrientGoal = useGoalsStore((s) => s.setNutrientGoal);
  const setPortionGoal = useGoalsStore((s) => s.setPortionGoal);

  const [activeId, setActiveId] = useState(members[0]?.id ?? '');
  const [configuring, setConfiguring] = useState(false);
  const activeMember = members.find((m) => m.id === activeId) ?? members[0];

  // Called unconditionally (before the early return below) since it's a
  // hook — falls back to '' when there's no active member yet, which
  // useGoalsFor handles fine (just returns the default goals shape, unused
  // in that case anyway).
  const goals = useGoalsFor(activeMember?.id ?? '');

  if (!activeMember) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={[typography.body, { padding: spacing.lg }]}>Add a family member first to set goals.</Text>
      </SafeAreaView>
    );
  }

  const validation = validateWeek(plan, activeMember.id, foods, goals);

  const metricResults = [
    ...NUTRIENTS.map((n) => ({
      key: n,
      label: NUTRIENT_META[n].label,
      count: validation.nutrientCounts[n],
      goal: goals.nutrientMinOccurrences[n],
      met: validation.nutrientStatus[n] === 'met',
    })),
  ];
  const overallPercent = Math.round((metricResults.filter((m) => m.met).length / metricResults.length) * 100);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <View style={styles.header}>
          <Text style={typography.h1}>Nutrition Goals</Text>
          <Avatar name={activeMember.name} ageGroup={activeMember.ageGroup} size={34} />
        </View>

        <View style={{ marginVertical: spacing.md }}>
          <SegmentedControl
            value={activeId}
            onChange={(id) => {
              setActiveId(id);
              setConfiguring(false);
            }}
            options={members.map((m) => ({ value: m.id, label: `${m.name} (${m.ageGroup === 'toddler' ? 'Toddler' : 'Adult'})` }))}
          />
        </View>

        {!configuring ? (
          <>
            <Card>
              <View style={styles.progressHeader}>
                <Text style={typography.label}>WEEKLY PROGRESS</Text>
                <View style={styles.percentBadge}>
                  <Text style={styles.percentText}>{overallPercent}% Overall</Text>
                </View>
              </View>

              {metricResults.map((m) => (
                <View key={m.key} style={styles.metricRow}>
                  <View style={styles.metricTopRow}>
                    <Text style={styles.metricLabel}>{m.label.toUpperCase()} OCCURRENCES</Text>
                    <Text style={styles.metricCount}>
                      {m.count} / {m.goal}
                    </Text>
                  </View>
                  <ProgressBar progress={m.goal === 0 ? 1 : m.count / m.goal} />
                  <View style={{ marginTop: 6, alignItems: 'flex-end' }}>
                    <Badge met={m.met} />
                  </View>
                </View>
              ))}
            </Card>

            <Text style={[typography.label, { marginTop: spacing.sm, marginBottom: spacing.sm }]}>PORTION TRACKING</Text>
            <View style={styles.portionRow}>
              <Card style={styles.portionCard}>
                <Text style={typography.label}>VEGGIE PORTIONS</Text>
                <Text style={styles.portionValue}>
                  {validation.veggieCount} <Text style={styles.portionGoal}>/ {goals.veggiePortionsPerWeek}</Text>
                </Text>
                <Badge met={validation.veggieStatus === 'met'} />
              </Card>
              <Card style={[styles.portionCard, { marginLeft: spacing.md }]}>
                <Text style={typography.label}>FRUIT PORTIONS</Text>
                <Text style={styles.portionValue}>
                  {validation.fruitCount} <Text style={styles.portionGoal}>/ {goals.fruitPortionsPerWeek}</Text>
                </Text>
                <Badge met={validation.fruitStatus === 'met'} />
              </Card>
            </View>

            <PillButton label="Configure Weekly Targets" variant="secondary" onPress={() => setConfiguring(true)} style={{ marginTop: spacing.md }} />
          </>
        ) : (
          <>
            {NUTRIENTS.map((n) => (
              <Card key={n}>
                <View style={styles.progressHeader}>
                  <Text style={typography.h3}>{NUTRIENT_META[n].label.toUpperCase()}</Text>
                  <Text style={styles.metricCount}>
                    {validation.nutrientCounts[n]} / {goals.nutrientMinOccurrences[n]}
                  </Text>
                </View>
                <Stepper value={goals.nutrientMinOccurrences[n]} onChange={(v) => setNutrientGoal(activeMember.id, n, v)} />
              </Card>
            ))}
            <Card>
              <View style={styles.progressHeader}>
                <Text style={typography.h3}>VEGGIE PORTIONS</Text>
                <Text style={styles.metricCount}>
                  {validation.veggieCount} / {goals.veggiePortionsPerWeek}
                </Text>
              </View>
              <Stepper value={goals.veggiePortionsPerWeek} onChange={(v) => setPortionGoal(activeMember.id, 'veggiePortionsPerWeek', v)} />
            </Card>
            <Card>
              <View style={styles.progressHeader}>
                <Text style={typography.h3}>FRUIT PORTIONS</Text>
                <Text style={styles.metricCount}>
                  {validation.fruitCount} / {goals.fruitPortionsPerWeek}
                </Text>
              </View>
              <Stepper value={goals.fruitPortionsPerWeek} onChange={(v) => setPortionGoal(activeMember.id, 'fruitPortionsPerWeek', v)} />
            </Card>

            <PillButton label="Done" onPress={() => setConfiguring(false)} style={{ marginTop: spacing.sm }} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  percentBadge: { backgroundColor: colors.surfaceMuted, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  percentText: { fontSize: 10, fontFamily: fontFamily.monoBold, letterSpacing: 0.5, color: colors.textPrimary },
  metricRow: { marginBottom: spacing.lg },
  metricTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  metricLabel: { fontSize: 10, fontFamily: fontFamily.monoBold, letterSpacing: 0.5, color: colors.textSecondary },
  metricCount: { fontSize: 12, fontFamily: fontFamily.monoBold, color: colors.textPrimary },
  portionRow: { flexDirection: 'row' },
  portionCard: { flex: 1 },
  portionValue: { fontSize: 24, fontFamily: fontFamily.monoBold, color: colors.textPrimary, marginVertical: spacing.sm },
  portionGoal: { fontSize: 14, color: colors.textSecondary },
  stepper: { flexDirection: 'row', alignItems: 'center' },
  stepBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  stepBtnText: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  stepValue: { flex: 1, alignItems: 'center' },
});
