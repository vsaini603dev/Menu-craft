# Menu Craft

A family meal planner: define family members, tag foods, plan a week of
breakfast/lunch/snack/dinner per person, and get live feedback against
weekly nutrition goals.

This code has been verified two ways: **type-checked end-to-end with `tsc`**
(zero errors) and **actually bundled for Android** via `npx expo export`
(1463 modules, zero errors, including the new font/icon assets). What it
hasn't been is run on a physical device, since that needs your phone.

## Phase 3: visual redesign

This update is a full visual rebuild based on a Figma export, replacing
the original warm-cream/coral theme with a teal-and-mint palette and a
dual-typography system: bold monospace (Space Mono) for structural/system
text — headers, labels, tags, nav — and regular system sans for actual
content (assigned food names, recipe text). No functional behavior changed
except where the new designs implied it (noted below) — this was a re-skin
of Phase 1/2's features, not a rebuild of them.

**New in this pass, beyond pure restyling:**
- **Vector icons throughout** — swapped emoji (🌅🍎🌙 etc.) for `@expo/vector-icons` (Ionicons), including a keyword-based auto-icon per Food Library card (fish for salmon, leaf for broccoli, etc. — see `guessFoodIcon()` in `constants.ts`)
- **Filter chips on the Food Library screen** — the original only had a search bar; the mockup showed the same All/Toddler/Adult/Quick/Medium/Tedious filter row used in the meal picker, now added there too
- **"Shared" meal display** — when every family member has the exact identical set of foods for a meal, it's now shown as one collapsed row instead of N duplicate rows. This is a display-layer change only (`MealSection.tsx`) — no data model change, so it degrades gracefully back to per-person rows the moment anyone's plan differs
- **Inline chip removal** — food chips now have their own "×" for instant removal; tapping the chip label still opens the recipe/detail sheet
- **Goals screen: review vs. configure modes** — defaults to a read-only progress view (overall %, per-metric MET/UNMET badges) with a "Configure Weekly Targets" button that reveals the editable steppers, rather than always showing edit controls
- **Family member switcher as a segmented control** on the Goals screen, replacing the avatar-scroll-row
- Tab bar's "Family" tab is now labeled **"Settings"** to match the mockup (same screen/functionality underneath — the route name stayed `Family` internally so nothing else had to change)

**Assumptions made where the mockup was ambiguous (worth checking against what you actually want):**
- App name stayed **"Menu Craft"** — the mockup's frames say "NutriPlan," which I read as the design tool's placeholder branding rather than a rename request. Easy to change if you did want that name.
- The "shared meal" feature only triggers when *every* family member's plan matches exactly. If some people are empty and others match, it falls back to per-person rows rather than guessing whether the empty ones should be included.
- "Today" vs "selected day" in the day-pill row: the mockup only showed one static state, so I made today's date number appear in the accent coral color while the actively-selected day gets the filled teal pill — these are visually distinct now, where the mockup screenshot didn't have to show both at once.
- Auto-icon selection for Food Library cards is a keyword guess against the food name, not a manual picker — occasionally wrong for unusual names, but zero extra data entry.

## What's included overall

**Core (Phase 1):** family setup, food library with tags/recipes, weekly planner with multi-food assignments and ad-hoc quick-add, toddler eating ratings, nutrition HUD, per-person weekly goals.

**Phase 2:** real `@gorhom/bottom-sheet` + Reanimated bottom sheets, week navigation (‹ › arrows), animated chip layout transitions.

**Phase 3 (this update):** full visual redesign per the Figma mockup, described above.

**Not built yet (by request — deferred for now):** cloud sync / multi-device. Everything is local-only via AsyncStorage — see the design doc's Supabase notes for the upgrade path whenever you're ready.

## Running it on your phone (step by step)

1. **Install Node.js** (LTS) if you don't have it: https://nodejs.org
2. **Install the Expo Go app** on your phone — search "Expo Go" in the App Store (iOS) or Play Store (Android).
3. **Create a fresh Expo project:**
   ```
   npx create-expo-app@latest menu-craft --template blank-typescript
   ```
4. **Copy this project's files into it**, overwriting where prompted: `App.tsx`, `app.json`, `babel.config.js`, `package.json`, and the entire `src/` folder.
5. **Install:**
   ```
   cd menu-craft
   npm install
   ```
6. **Double-check SDK alignment** (safe to always run):
   ```
   npx expo install --fix
   ```
7. **Start the dev server:**
   ```
   npx expo start -c
   ```
8. **Open it on your phone**: scan the QR code with Expo Go (Android) or the Camera app (iOS).

## Project structure

```
App.tsx                    entry point — loads Space Mono fonts before rendering,
                            wraps app in GestureHandlerRootView, SafeAreaProvider,
                            BottomSheetModalProvider
src/
  theme/                    colors, spacing, typography (now with fontFamily for
                             the mono/mono-bold + system-sans pairing)
  types/                    all TypeScript interfaces
  constants.ts               display metadata for meal types (now Ionicons names),
                              nutrients, effort, ratings, + guessFoodIcon()
  lib/                       id generator, week helpers, pure validateWeek()
  store/                     Zustand stores (family, food, week plan, goals)
  components/                 Chip, Avatar, PillButton, Card, ProgressBar,
                               Badge (new — MET/UNMET pill), SegmentedControl (new)
  navigation/RootNavigator.tsx  bottom tabs + onboarding gate
  screens/
    family/                   onboarding + Settings tab (shared FamilyManager)
    planner/                   PlannerScreen, NutritionHUD, MealSection,
                                FoodPickerSheet, FoodDetailSheet
    library/                   Food Library list (now with filters) + edit/create form
    goals/                     redesigned: segmented control, progress/configure modes
```

## Next steps

1. When you're ready for multi-device sync, see the design doc's Supabase notes — the store layer was built so this is a contained swap, not a rewrite
2. If you want the "shared meal" collapsing to be an explicit user choice rather than an automatic detection, that'd mean adding a real `sharedAcrossMembers` flag to `MealAssignment` instead of inferring it from matching content — a small data model change if you want it
3. The Goals screen still always shows "this week" regardless of what week the Planner is navigated to — same open question as Phase 2, still unresolved
