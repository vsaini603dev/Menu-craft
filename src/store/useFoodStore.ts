import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Food } from '../types';
import { generateId } from '../lib/id';

// A handful of starter foods so the app isn't empty on first launch.
// Only used before the persisted store has any data of its own.
const SEED_FOODS: Food[] = [
  {
    id: generateId('food_'),
    name: 'Apple Slices & Peanut Butter',
    suitableFor: ['toddler', 'adult'],
    effort: 'quick',
    nutrients: ['protein'],
    isVeggiePortion: false,
    isFruitPortion: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId('food_'),
    name: 'Avocado Toast',
    suitableFor: ['adult'],
    effort: 'quick',
    nutrients: [],
    isVeggiePortion: true,
    isFruitPortion: false,
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId('food_'),
    name: 'Beef Stew',
    suitableFor: ['adult'],
    effort: 'tedious',
    nutrients: ['protein', 'iron'],
    isVeggiePortion: true,
    isFruitPortion: false,
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId('food_'),
    name: 'Berry Smoothie',
    suitableFor: ['toddler', 'adult'],
    effort: 'quick',
    nutrients: ['vitC', 'calcium'],
    isVeggiePortion: false,
    isFruitPortion: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId('food_'),
    name: 'Cheesy Scrambled Eggs',
    suitableFor: ['toddler', 'adult'],
    effort: 'quick',
    nutrients: ['protein', 'calcium'],
    isVeggiePortion: false,
    isFruitPortion: false,
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId('food_'),
    name: 'Oat Bar',
    suitableFor: ['toddler'],
    effort: 'medium',
    nutrients: ['iron'],
    isVeggiePortion: false,
    isFruitPortion: false,
    updatedAt: new Date().toISOString(),
  },
];

interface FoodState {
  foods: Food[];
  addFood: (food: Omit<Food, 'id' | 'updatedAt'>) => Food;
  updateFood: (id: string, updates: Partial<Omit<Food, 'id'>>) => void;
  removeFood: (id: string) => void;
}

export const useFoodStore = create<FoodState>()(
  persist(
    (set, get) => ({
      foods: SEED_FOODS,
      addFood: (food) => {
        const newFood: Food = { ...food, id: generateId('food_'), updatedAt: new Date().toISOString() };
        set((state) => ({ foods: [...state.foods, newFood] }));
        return newFood;
      },
      updateFood: (id, updates) =>
        set((state) => ({
          foods: state.foods.map((f) => (f.id === id ? { ...f, ...updates, updatedAt: new Date().toISOString() } : f)),
        })),
      removeFood: (id) => set((state) => ({ foods: state.foods.filter((f) => f.id !== id) })),
    }),
    { name: 'food-store', storage: createJSONStorage(() => AsyncStorage) }
  )
);
