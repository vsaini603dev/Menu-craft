import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NutritionGoals, Nutrient } from '../types';

const DEFAULT_GOALS: Omit<NutritionGoals, 'familyMemberId'> = {
  nutrientMinOccurrences: { protein: 7, calcium: 7, vitC: 5, iron: 4 },
  veggiePortionsPerWeek: 10,
  fruitPortionsPerWeek: 7,
};

interface GoalsState {
  goals: Record<string, NutritionGoals>;
  setNutrientGoal: (familyMemberId: string, nutrient: Nutrient, value: number) => void;
  setPortionGoal: (
    familyMemberId: string,
    key: 'veggiePortionsPerWeek' | 'fruitPortionsPerWeek',
    value: number
  ) => void;
}

export const useGoalsStore = create<GoalsState>()(
  persist(
    (set) => ({
      goals: {},

      setNutrientGoal: (familyMemberId, nutrient, value) =>
        set((state) => {
          const current = state.goals[familyMemberId] ?? { familyMemberId, ...DEFAULT_GOALS };
          return {
            goals: {
              ...state.goals,
              [familyMemberId]: {
                ...current,
                nutrientMinOccurrences: { ...current.nutrientMinOccurrences, [nutrient]: Math.max(0, value) },
              },
            },
          };
        }),

      setPortionGoal: (familyMemberId, key, value) =>
        set((state) => {
          const current = state.goals[familyMemberId] ?? { familyMemberId, ...DEFAULT_GOALS };
          return {
            goals: { ...state.goals, [familyMemberId]: { ...current, [key]: Math.max(0, value) } },
          };
        }),
    }),
    { name: 'goals-store', storage: createJSONStorage(() => AsyncStorage) }
  )
);

// Reactive hook for reading one member's goals inside a component. This is
// the important part: selecting `state.goals[familyMemberId]` directly means
// Zustand can actually detect when that specific value changes and re-render.
// The earlier `getGoals` store *method* looked convenient but was a trap —
// subscribing to a function reference (which never changes) rather than to
// the data itself meant components using it never re-rendered on updates,
// even though the underlying writes were succeeding.
export function useGoalsFor(familyMemberId: string): NutritionGoals {
  const raw = useGoalsStore((s) => s.goals[familyMemberId]);
  return raw ?? { familyMemberId, ...DEFAULT_GOALS };
}
