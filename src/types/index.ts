import type { Ionicons } from '@expo/vector-icons';

export type AgeGroup = 'toddler' | 'adult';
export type Effort = 'quick' | 'medium' | 'tedious';
export type MealType = 'breakfast' | 'lunch' | 'snack' | 'dinner';
export type Nutrient = 'protein' | 'calcium' | 'vitC' | 'iron';
// A structured, reportable outcome for one family member's meal assignment.
// The assignment also retains its date, meal type, and foods, so this can be
// aggregated into future eating trends without changing the stored schema.
export type EatingRating = 'not_eaten' | 'ate_little' | 'ate_okay' | 'ate_very_well';
export type FoodIcon = keyof typeof Ionicons.glyphMap;

export interface FamilyMember {
  id: string;
  name: string;
  ageGroup: AgeGroup;
  trackEatingRating: boolean;
}

export interface Recipe {
  ingredients: { name: string; qty: string }[];
  steps: string[];
  prepTimeMinutes?: number;
}

export interface Food {
  id: string;
  name: string;
  suitableFor: AgeGroup[];
  effort: Effort;
  nutrients: Nutrient[];
  isVeggiePortion: boolean;
  isFruitPortion: boolean;
  icon?: FoodIcon;
  note?: string;
  recipe?: Recipe;
  updatedAt: string;
}

// A food placed into a meal — either a library reference or a typed-in one-off
export interface FoodEntry {
  id: string;
  source: 'library' | 'adhoc';
  foodId?: string;
  adhoc?: {
    name: string;
    nutrients?: Nutrient[];
    isVeggiePortion?: boolean;
    isFruitPortion?: boolean;
  };
}

// One person's plan for one meal
export interface MealAssignment {
  familyMemberId: string;
  foods: FoodEntry[];
  // Categorical rather than display-oriented, ready for future reporting.
  eatingRating?: EatingRating;
}

export interface MealSlot {
  day: 0 | 1 | 2 | 3 | 4 | 5 | 6; // Mon - Sun
  mealType: MealType;
  assignments: MealAssignment[];
}

export interface WeekPlan {
  id: string; // Monday date, e.g. "2026-08-10"
  slots: MealSlot[];
}

export interface NutritionGoals {
  familyMemberId: string;
  nutrientMinOccurrences: Record<Nutrient, number>;
  veggiePortionsPerWeek: number;
  fruitPortionsPerWeek: number;
}

export interface WeekValidation {
  familyMemberId: string;
  nutrientCounts: Record<Nutrient, number>;
  veggieCount: number;
  fruitCount: number;
  nutrientStatus: Record<Nutrient, 'met' | 'unmet'>;
  veggieStatus: 'met' | 'unmet';
  fruitStatus: 'met' | 'unmet';
  overallMet: boolean;
}
