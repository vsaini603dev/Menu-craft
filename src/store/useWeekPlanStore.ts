import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WeekPlan, MealSlot, MealType, FoodEntry, EatingRating } from '../types';

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
    }),
    { name: 'weekplan-store', storage: createJSONStorage(() => AsyncStorage) }
  )
);
