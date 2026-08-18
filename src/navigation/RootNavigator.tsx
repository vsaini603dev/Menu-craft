import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useFamilyStore } from '../store/useFamilyStore';
import { FamilySetupScreen } from '../screens/family/FamilySetupScreen';
import { PlannerScreen } from '../screens/planner/PlannerScreen';
import { FoodLibraryScreen } from '../screens/library/FoodLibraryScreen';
import { FoodEditScreen } from '../screens/library/FoodEditScreen';
import { GoalsScreen } from '../screens/goals/GoalsScreen';
import { FamilyScreen } from '../screens/family/FamilyScreen';
import { colors, fontFamily } from '../theme';

const Tab = createBottomTabNavigator();
const LibraryStack = createNativeStackNavigator();

function LibraryStackNavigator() {
  return (
    <LibraryStack.Navigator screenOptions={{ headerShown: false }}>
      <LibraryStack.Screen name="FoodList" component={FoodLibraryScreen} />
      <LibraryStack.Screen name="FoodEdit" component={FoodEditScreen} />
    </LibraryStack.Navigator>
  );
}

// Route name -> (icon, tab label). Kept separate from the route name itself
// so the internal "Family" route can stay stable (deep links, state
// persistence) while the visible label follows the new design's "Settings"
// naming.
const TAB_META: Record<string, { icon: keyof typeof Ionicons.glyphMap; label: string }> = {
  Planner: { icon: 'calendar-outline', label: 'Planner' },
  Library: { icon: 'book-outline', label: 'Library' },
  Goals: { icon: 'radio-button-on-outline', label: 'Goals' },
  Family: { icon: 'settings-outline', label: 'Settings' },
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: { fontSize: 10, fontFamily: fontFamily.monoBold, letterSpacing: 0.4, textTransform: 'uppercase' },
        tabBarLabel: TAB_META[route.name].label,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 64,
          paddingBottom: 10,
          paddingTop: 6,
        },
        tabBarIcon: ({ color, size }) => <Ionicons name={TAB_META[route.name].icon} size={size ?? 20} color={color} />,
      })}
    >
      <Tab.Screen name="Planner" component={PlannerScreen} />
      <Tab.Screen name="Library" component={LibraryStackNavigator} />
      <Tab.Screen name="Goals" component={GoalsScreen} />
      <Tab.Screen name="Family" component={FamilyScreen} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const members = useFamilyStore((s) => s.members);
  const onboardingComplete = useFamilyStore((s) => s.onboardingComplete);

  return (
    <NavigationContainer>
      {!onboardingComplete || members.length === 0 ? <FamilySetupScreen /> : <MainTabs />}
    </NavigationContainer>
  );
}
