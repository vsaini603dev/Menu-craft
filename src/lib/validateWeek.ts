import { WeekPlan, Food, NutritionGoals, Nutrient, WeekValidation } from '../types';

function emptyCounts(): Record<Nutrient, number> {
  return { protein: 0, calcium: 0, vitC: 0, iron: 0 };
}

// Pure function: no React, no storage — easy to test and reuse anywhere
// (the HUD, the Goals screen, a future summary/notification).
export function validateWeek(
  plan: WeekPlan | undefined,
  familyMemberId: string,
  foods: Food[],
  goals: NutritionGoals
): WeekValidation {
  const counts = emptyCounts();
  let veggieCount = 0;
  let fruitCount = 0;

  if (plan) {
    for (const slot of plan.slots) {
      const assignment = slot.assignments.find((a) => a.familyMemberId === familyMemberId);
      if (!assignment) continue;

      for (const entry of assignment.foods) {
        const resolved = entry.source === 'library'
          ? foods.find((f) => f.id === entry.foodId)
          : entry.adhoc;
        if (!resolved) continue;

        (resolved.nutrients ?? []).forEach((n) => {
          counts[n] += 1;
        });
        if (resolved.isVeggiePortion) veggieCount += 1;
        if (resolved.isFruitPortion) fruitCount += 1;
      }
    }
  }

  const nutrientStatus = {} as Record<Nutrient, 'met' | 'unmet'>;
  (Object.keys(counts) as Nutrient[]).forEach((n) => {
    nutrientStatus[n] = counts[n] >= (goals.nutrientMinOccurrences[n] ?? 0) ? 'met' : 'unmet';
  });

  const veggieStatus = veggieCount >= goals.veggiePortionsPerWeek ? 'met' : 'unmet';
  const fruitStatus = fruitCount >= goals.fruitPortionsPerWeek ? 'met' : 'unmet';

  const overallMet =
    veggieStatus === 'met' &&
    fruitStatus === 'met' &&
    (Object.values(nutrientStatus) as ('met' | 'unmet')[]).every((s) => s === 'met');

  return {
    familyMemberId,
    nutrientCounts: counts,
    veggieCount,
    fruitCount,
    nutrientStatus,
    veggieStatus,
    fruitStatus,
    overallMet,
  };
}
