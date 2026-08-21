import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WeekPlan, MealSlot, MealType, FoodEntry, EatingRating } from '../types';
import { generateId } from '../lib/id';

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner'];

function emptySlots(): MealSlot[] {
  const slots: MealSlot[] = [];
  for (let day = 0; day < 7; day++) {
    for (const mealType of MEAL_TYPES) {
      slots.push({ day: day as MealSlot['day'], mealType, assignments: [] });
    }
  }
  return slots;
}

function blankWeek(weekId: string): WeekPlan {
  return { id: weekId, slots: emptySlots() };
}

// Ratings used to be emoji-oriented. Map persisted values to the new
// reportable categories so existing plans remain usable after the upgrade.
function migrateEatingRatings(persistedState: unknown) {
  const state = persistedState as { plans?: Record<string, WeekPlan> };
  if (!state?.plans) return persistedState;

  const ratingMap: Record<string, EatingRating> = {
    not_well: 'ate_little',
    okay: 'ate_okay',
    very_well: 'ate_very_well',
    not_eaten: 'not_eaten',
    ate_little: 'ate_little',
    ate_okay: 'ate_okay',
    ate_very_well: 'ate_very_well',
  };

  const plans = Object.fromEntries(
    Object.entries(state.plans).map(([weekId, plan]) => [
      weekId,
      {
        ...plan,
        slots: plan.slots.map((slot) => ({
          ...slot,
          assignments: slot.assignments.map((assignment) => {
            const rating = assignment.eatingRating ? ratingMap[assignment.eatingRating] : undefined;
            return { ...assignment, eatingRating: rating };
          }),
        })),
      },
    ])
  );

  return { ...state, plans };
}

interface WeekPlanState {
  plans: Record<string, WeekPlan>;
  getPlan: (weekId: string) => WeekPlan;
  addFood: (weekId: string, day: number, mealType: MealType, familyMemberId: string, entry: FoodEntry) => void;
  removeFood: (weekId: string, day: number, mealType: MealType, familyMemberId: string, entryId: string) => void;
  setEatingRating: (
    weekId: string,
    day: number,
    mealType: MealType,
    familyMemberId: string,
    rating: EatingRating | undefined
  ) => void;
  copyDay: (sourceWeekId: string, sourceDay: number, targetWeekId: string, targetDay: number) => void;
}

export const useWeekPlanStore = create<WeekPlanState>()(
  persist(
    (set, get) => ({
      plans: {},

      getPlan: (weekId) => get().plans[weekId] ?? blankWeek(weekId),

      addFood: (weekId, day, mealType, familyMemberId, entry) =>
        set((state) => {
          const plan = state.plans[weekId] ?? blankWeek(weekId);
          const slots = plan.slots.map((slot) => {
            if (slot.day !== day || slot.mealType !== mealType) return slot;
            const existing = slot.assignments.find((a) => a.familyMemberId === familyMemberId);
            if (existing) {
              return {
                ...slot,
                assignments: slot.assignments.map((a) =>
                  a.familyMemberId === familyMemberId ? { ...a, foods: [...a.foods, entry] } : a
                ),
              };
            }
            return {
              ...slot,
              assignments: [...slot.assignments, { familyMemberId, foods: [entry] }],
            };
          });
          return { plans: { ...state.plans, [weekId]: { ...plan, slots } } };
        }),

      removeFood: (weekId, day, mealType, familyMemberId, entryId) =>
        set((state) => {
          const plan = state.plans[weekId];
          if (!plan) return state;
          const slots = plan.slots.map((slot) => {
            if (slot.day !== day || slot.mealType !== mealType) return slot;
            return {
              ...slot,
              assignments: slot.assignments.map((a) =>
                a.familyMemberId === familyMemberId ? { ...a, foods: a.foods.filter((f) => f.id !== entryId) } : a
              ),
            };
          });
          return { plans: { ...state.plans, [weekId]: { ...plan, slots } } };
        }),

      setEatingRating: (weekId, day, mealType, familyMemberId, rating) =>
        set((state) => {
          const plan = state.plans[weekId] ?? blankWeek(weekId);
          const slots = plan.slots.map((slot) => {
            if (slot.day !== day || slot.mealType !== mealType) return slot;
            return {
              ...slot,
              assignments: slot.assignments.map((a) =>
                a.familyMemberId === familyMemberId ? { ...a, eatingRating: rating } : a
              ),
            };
          });
          return { plans: { ...state.plans, [weekId]: { ...plan, slots } } };
        }),

      copyDay: (sourceWeekId, sourceDay, targetWeekId, targetDay) =>
        set((state) => {
          const sourcePlan = state.plans[sourceWeekId] ?? blankWeek(sourceWeekId);
          const targetPlan = state.plans[targetWeekId] ?? blankWeek(targetWeekId);
          const slots = targetPlan.slots.map((slot) => {
            if (slot.day !== targetDay) return slot;
            const sourceSlot = sourcePlan.slots.find((candidate) => candidate.day === sourceDay && candidate.mealType === slot.mealType);
            return {
              ...slot,
              // Copy the planned foods, but not eating ratings; ratings belong to the day they were recorded on.
              assignments: (sourceSlot?.assignments ?? []).map((assignment) => ({
                familyMemberId: assignment.familyMemberId,
                foods: assignment.foods.map((entry) => ({
                  ...entry,
                  id: generateId('entry_'),
                  adhoc: entry.adhoc
                    ? { ...entry.adhoc, nutrients: entry.adhoc.nutrients ? [...entry.adhoc.nutrients] : undefined }
                    : undefined,
                })),
              })),
            };
          });
          return { plans: { ...state.plans, [targetWeekId]: { ...targetPlan, slots } } };
        }),
    }),
    { name: 'weekplan-store', storage: createJSONStorage(() => AsyncStorage), version: 2, migrate: migrateEatingRatings }
  )
);
