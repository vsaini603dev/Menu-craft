import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ProgressBar } from '../../components/ProgressBar';
import { colors, spacing, typography } from '../../theme';
import { NUTRIENT_META } from '../../constants';
import { WeekValidation, NutritionGoals, Nutrient } from '../../types';

interface Props {
  validation: WeekValidation;
  goals: NutritionGoals;
}

type MetricRow = { label: string; count: number; goal: number };

function Metric({ label, count, goal }: MetricRow) {
  return (
    <View style={styles.metric}>
      <View style={styles.metricHeader}>
        <Text style={typography.label}>{label}</Text>
        <Text style={styles.metricCount}>
          {count}/{goal}
        </Text>
      </View>
      <ProgressBar progress={goal === 0 ? 1 : count / goal} />
    </View>
  );
}

const NUTRIENTS: Nutrient[] = ['protein', 'calcium', 'vitC', 'iron'];

export function NutritionHUD({ validation, goals }: Props) {
  const metrics: MetricRow[] = [
    ...NUTRIENTS.map((n) => ({
      label: NUTRIENT_META[n].label,
      count: validation.nutrientCounts[n],
      goal: goals.nutrientMinOccurrences[n] ?? 0,
    })),
    { label: 'Veggies', count: validation.veggieCount, goal: goals.veggiePortionsPerWeek },
    { label: 'Fruits', count: validation.fruitCount, goal: goals.fruitPortionsPerWeek },
  ];

  return (
    <View style={styles.grid}>
      {metrics.map((m) => (
        <Metric key={m.label} {...m} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  metric: { width: '48%', marginBottom: spacing.md },
  metricHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  metricCount: { fontSize: 12, fontWeight: '700', color: colors.textPrimary },
});
