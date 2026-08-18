import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FamilyMember, AgeGroup } from '../types';
import { generateId } from '../lib/id';

interface FamilyState {
  members: FamilyMember[];
  onboardingComplete: boolean;
  addMember: (name: string, ageGroup: AgeGroup) => void;
  updateMember: (id: string, updates: Partial<Omit<FamilyMember, 'id'>>) => void;
  removeMember: (id: string) => void;
  completeOnboarding: () => void;
}

export const useFamilyStore = create<FamilyState>()(
  persist(
    (set) => ({
      members: [],
      onboardingComplete: false,
      addMember: (name, ageGroup) =>
        set((state) => ({
          members: [
            ...state.members,
            {
              id: generateId('mem_'),
              name: name.trim(),
              ageGroup,
              trackEatingRating: ageGroup === 'toddler',
            },
          ],
        })),
      updateMember: (id, updates) =>
        set((state) => ({
          members: state.members.map((m) => (m.id === id ? { ...m, ...updates } : m)),
        })),
      removeMember: (id) =>
        set((state) => ({
          members: state.members.filter((m) => m.id !== id),
        })),
      completeOnboarding: () => set({ onboardingComplete: true }),
    }),
    { name: 'family-store', storage: createJSONStorage(() => AsyncStorage) }
  )
);
