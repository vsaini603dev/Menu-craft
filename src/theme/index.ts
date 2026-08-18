// Redesigned palette matching the "NutriPlan" mockup: teal/mint over warm
// neutral, with a monospace uppercase system for structure (headers, labels,
// chips, nav) and a regular sans for actual content (assigned food names,
// recipe text) — kept as two distinct font roles throughout the app.

export const colors = {
  background: '#F2F0EA',
  surface: '#FFFFFF',
  surfaceMint: '#E8F2EF', // the pale mint card fill used for meal/library/goal cards
  surfaceMuted: '#E9E5DB',

  primary: '#186B60', // deep teal — CTAs, active states, progress fills, "MET"
  primaryMuted: '#D3E7E2',
  primarySoft: '#EAF3F1',

  today: '#D9714A', // warm coral used only for the "today" date indicator

  textPrimary: '#1D2B27',
  textSecondary: '#6E7873',
  textOnPrimary: '#FFFFFF',
  border: '#DFE6E2',

  success: '#186B60',
  warning: '#C08A2E',

  // Tag chips are largely monochrome blue-gray in this design, not
  // color-coded per nutrient the way the old theme was — matches the
  // mockup's more restrained, technical look.
  tag: '#2F4A45',
  tagBg: '#DEE6E4',

  tagVeggie: '#186B60',
  tagVeggieBg: '#D9EAE5',
  tagFruit: '#B5622E',
  tagFruitBg: '#F1E1D3',

  effortQuick: '#186B60',
  effortQuickBg: '#D9EAE5',
  effortMedium: '#B08A2E',
  effortMediumBg: '#EFE6C9',
  effortTedious: '#B5622E',
  effortTediousBg: '#F1E1D3',

  toddler: '#D9714A',
  adult: '#3E5652',

  metBg: '#186B60',
  metText: '#FFFFFF',
  unmetBg: '#E7E3D9',
  unmetText: '#6E7873',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const radius = { sm: 8, md: 14, lg: 18, xl: 24, pill: 999 };

// Loaded via useFonts() in App.tsx before anything renders — see fonts.ts
export const fontFamily = {
  mono: 'SpaceMono_400Regular',
  monoBold: 'SpaceMono_700Bold',
};

export const typography = {
  // Structural/system text: bold monospace, uppercase, wide tracking
  h1: { fontSize: 24, fontFamily: fontFamily.monoBold, color: colors.textPrimary, letterSpacing: 0.5 },
  h2: { fontSize: 18, fontFamily: fontFamily.monoBold, color: colors.textPrimary, letterSpacing: 0.5 },
  h3: { fontSize: 13, fontFamily: fontFamily.monoBold, color: colors.textPrimary, letterSpacing: 0.5 },
  label: { fontSize: 11, fontFamily: fontFamily.monoBold, color: colors.textSecondary, letterSpacing: 0.8 },
  mono: { fontSize: 12, fontFamily: fontFamily.mono, color: colors.textSecondary },

  // Content text: regular system sans, mixed case — used for actual food
  // names, recipe steps, free-text the user typed
  body: { fontSize: 15, fontWeight: '400' as const, color: colors.textPrimary },
  small: { fontSize: 12, fontWeight: '500' as const, color: colors.textSecondary },
};
