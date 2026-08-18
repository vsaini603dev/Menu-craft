import { colors } from './theme';
import { MealType, Nutrient, Effort, AgeGroup, EatingRating, FoodIcon } from './types';

type IoniconName = FoodIcon;

export const MEAL_TYPES: { key: MealType; label: string; icon: IoniconName }[] = [
  { key: 'breakfast', label: 'Breakfast', icon: 'sunny-outline' },
  { key: 'lunch', label: 'Lunch', icon: 'restaurant-outline' },
  { key: 'snack', label: 'Snack', icon: 'nutrition-outline' },
  { key: 'dinner', label: 'Dinner', icon: 'moon-outline' },
];

// This design uses one restrained, largely monochrome tag style rather than
// color-coding every nutrient/effort level individually — the only real
// accent color in the whole app is the primary teal, reserved for active/
// selected/met states. Keeping these as separate metadata maps (rather than
// inlining "gray") so any single tag type can still be recolored later
// without touching every screen that renders one.
export const NUTRIENT_META: Record<Nutrient, { label: string; color: string; bg: string }> = {
  protein: { label: 'Protein', color: colors.tag, bg: colors.tagBg },
  calcium: { label: 'Calcium', color: colors.tag, bg: colors.tagBg },
  vitC: { label: 'Vit C', color: colors.tag, bg: colors.tagBg },
  iron: { label: 'Iron', color: colors.tag, bg: colors.tagBg },
};

export const EFFORT_META: Record<Effort, { label: string; color: string; bg: string }> = {
  quick: { label: 'Quick', color: colors.tag, bg: colors.tagBg },
  medium: { label: 'Medium', color: colors.tag, bg: colors.tagBg },
  tedious: { label: 'Tedious', color: colors.tag, bg: colors.tagBg },
};

export const AGE_GROUP_META: Record<AgeGroup, { label: string; color: string }> = {
  toddler: { label: 'Toddler', color: colors.toddler },
  adult: { label: 'Adult', color: colors.adult },
};

export const RATING_META: Record<EatingRating, { label: string; emoji: string }> = {
  not_well: { label: 'Not well', emoji: '😕' },
  okay: { label: 'Okay', emoji: '🙂' },
  very_well: { label: 'Very well', emoji: '😋' },
};

// A compact, food-specific selection rather than the full Ionicons catalogue.
// Leaving this unset retains the automatic icon suggested from the food name.
export const FOOD_ICON_OPTIONS: { name: FoodIcon; label: string }[] = [
  { name: 'egg-outline', label: 'Eggs' },
  { name: 'nutrition-outline', label: 'Fruit' },
  { name: 'leaf-outline', label: 'Veggies' },
  { name: 'fish-outline', label: 'Fish' },
  { name: 'pizza-outline', label: 'Pizza' },
  { name: 'restaurant-outline', label: 'Pasta' },
  { name: 'fast-food-outline', label: 'Bread' },
  { name: 'flame-outline', label: 'Grill' },
  { name: 'cafe-outline', label: 'Cereal' },
  { name: 'ice-cream-outline', label: 'Dairy' },
  { name: 'water-outline', label: 'Drink' },
];

// Simple keyword heuristic so Food Library cards get a visually distinct
// icon per food without requiring the user to pick one manually — matches
// the mockup's per-card icon variety (fish for salmon, leaf for broccoli,
// pizza for pizza, etc.) at the cost of occasionally guessing wrong for an
// unusual name, which is an acceptable trade for zero extra data entry.
const ICON_KEYWORDS: [RegExp, IoniconName][] = [
  [/salmon|fish|tuna|shrimp/i, 'fish-outline'],
  [/pizza/i, 'pizza-outline'],
  [/broccoli|spinach|veg|salad|greens/i, 'leaf-outline'],
  [/apple|fruit|berry|berries|banana|orange/i, 'nutrition-outline'],
  [/egg|omelette|omelet/i, 'egg-outline'],
  [/pasta|noodle|spaghetti/i, 'restaurant-outline'],
  [/oat|cereal|porridge/i, 'cafe-outline'],
  [/smoothie|shake|juice/i, 'water-outline'],
  [/bread|toast|sandwich|bagel/i, 'fast-food-outline'],
  [/chicken|beef|pork|meat|stew/i, 'flame-outline'],
  [/cheese|yogurt|milk/i, 'ice-cream-outline'],
];

export function guessFoodIcon(name: string): IoniconName {
  for (const [pattern, icon] of ICON_KEYWORDS) {
    if (pattern.test(name)) return icon;
  }
  return 'restaurant-outline';
}
