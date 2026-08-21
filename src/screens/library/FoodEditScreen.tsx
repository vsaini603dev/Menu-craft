import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Switch, Alert, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useFoodStore } from '../../store/useFoodStore';
import { Chip } from '../../components/Chip';
import { PillButton } from '../../components/PillButton';
import { colors, spacing, typography, radius, fontFamily } from '../../theme';
import { AgeGroup, Effort, Nutrient, Recipe, FoodIcon } from '../../types';
import { AGE_GROUP_META, EFFORT_META, NUTRIENT_META, FOOD_ICON_OPTIONS, guessFoodIcon } from '../../constants';

const AGE_GROUPS: AgeGroup[] = ['toddler', 'adult'];
const EFFORTS: Effort[] = ['quick', 'medium', 'tedious'];
const NUTRIENTS: Nutrient[] = ['protein', 'calcium', 'vitC', 'iron'];

export function FoodEditScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const foodId: string | undefined = route.params?.foodId;

  const foods = useFoodStore((s) => s.foods);
  const addFood = useFoodStore((s) => s.addFood);
  const updateFood = useFoodStore((s) => s.updateFood);
  const removeFood = useFoodStore((s) => s.removeFood);

  const existing = foods.find((f) => f.id === foodId);

  const [name, setName] = useState(existing?.name ?? '');
  const [suitableFor, setSuitableFor] = useState<AgeGroup[]>(existing?.suitableFor ?? []);
  const [effort, setEffort] = useState<Effort>(existing?.effort ?? 'quick');
  const [nutrients, setNutrients] = useState<Nutrient[]>(existing?.nutrients ?? []);
  const [isVeggie, setIsVeggie] = useState(existing?.isVeggiePortion ?? false);
  const [isFruit, setIsFruit] = useState(existing?.isFruitPortion ?? false);
  const [icon, setIcon] = useState<FoodIcon | undefined>(existing?.icon);
  const [note, setNote] = useState(existing?.note ?? '');
  const [showRecipe, setShowRecipe] = useState(!!existing?.recipe);
  const [prepTime, setPrepTime] = useState(existing?.recipe?.prepTimeMinutes?.toString() ?? '');
  const [ingredients, setIngredients] = useState(existing?.recipe?.ingredients ?? []);
  const [steps, setSteps] = useState<string[]>(existing?.recipe?.steps ?? ['']);
  const [ingName, setIngName] = useState('');
  const [ingQty, setIngQty] = useState('');
  const [ingredientPickerVisible, setIngredientPickerVisible] = useState(false);
  const [ingredientSuggestionsVisible, setIngredientSuggestionsVisible] = useState(false);

  const toggleAge = (a: AgeGroup) => setSuitableFor((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
  const toggleNutrient = (n: Nutrient) => setNutrients((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]));

  const normalizeIngredient = (ingredientName: string) => ingredientName.trim().toLocaleLowerCase();
  const normalizedIngredientName = normalizeIngredient(ingName);
  const matchingIngredient = ingredients.find((ingredient) => normalizeIngredient(ingredient.name) === normalizedIngredientName);
  const canAddIngredient = !!normalizedIngredientName && !matchingIngredient;

  const previousIngredients = React.useMemo(() => {
    const uniqueIngredients = new Map<string, string>();
    foods.forEach((food) => {
      food.recipe?.ingredients.forEach((ingredient) => {
        const normalizedName = normalizeIngredient(ingredient.name);
        if (normalizedName && !uniqueIngredients.has(normalizedName)) {
          uniqueIngredients.set(normalizedName, ingredient.name.trim());
        }
      });
    });
    return [...uniqueIngredients.values()].sort((a, b) => a.localeCompare(b));
  }, [foods]);

  const matchingPreviousIngredients = previousIngredients.filter((ingredientName) =>
    ingredientName.toLocaleLowerCase().includes(normalizedIngredientName)
  );
  const canonicalIngredientName = previousIngredients.find(
    (ingredientName) => normalizeIngredient(ingredientName) === normalizedIngredientName
  );
  const ingredientSuggestions = matchingPreviousIngredients
    .filter((ingredientName) => !ingredients.some((ingredient) => normalizeIngredient(ingredient.name) === normalizeIngredient(ingredientName)))
    .slice(0, 4);

  const addIngredient = () => {
    if (!canAddIngredient) return;
    setIngredients((prev) => [...prev, { name: canonicalIngredientName ?? ingName.trim(), qty: ingQty.trim() || '1' }]);
    setIngName('');
    setIngQty('');
    setIngredientSuggestionsVisible(false);
  };

  const updateStep = (i: number, text: string) => setSteps((prev) => prev.map((s, idx) => (idx === i ? text : s)));
  const addStep = () => setSteps((prev) => [...prev, '']);
  const removeStep = (i: number) => setSteps((prev) => prev.filter((_, idx) => idx !== i));

  const handleSave = () => {
    if (!name.trim() || suitableFor.length === 0) return;
    const recipe: Recipe | undefined = showRecipe
      ? { ingredients, steps: steps.filter((s) => s.trim()), prepTimeMinutes: prepTime ? Number(prepTime) : undefined }
      : undefined;

    const payload = {
      name: name.trim(),
      suitableFor,
      effort,
      nutrients,
      isVeggiePortion: isVeggie,
      isFruitPortion: isFruit,
      icon,
      note: note.trim() || undefined,
      recipe,
    };

    if (existing) {
      updateFood(existing.id, payload);
    } else {
      addFood(payload);
    }
    navigation.goBack();
  };

  const handleDelete = () => {
    if (!existing) return;

    Alert.alert('Delete food?', `Are you sure you want to delete “${existing.name}”?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          removeFood(existing.id);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={typography.h2}>{existing ? 'Edit Food' : 'New Food'}</Text>
          <View style={{ width: 22 }} />
        </View>

        <Text style={typography.label}>NAME</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Beef Stew" placeholderTextColor={colors.textSecondary} />

        <Text style={typography.label}>SUITABLE FOR</Text>
        <View style={styles.chipRow}>
          {AGE_GROUPS.map((a) => (
            <Chip key={a} label={AGE_GROUP_META[a].label} selected={suitableFor.includes(a)} selectedColor={AGE_GROUP_META[a].color} onPress={() => toggleAge(a)} />
          ))}
        </View>

        <Text style={typography.label}>EFFORT</Text>
        <View style={styles.chipRow}>
          {EFFORTS.map((e) => (
            <Chip key={e} label={EFFORT_META[e].label} selected={effort === e} selectedColor={EFFORT_META[e].color} onPress={() => setEffort(e)} />
          ))}
        </View>

        <Text style={typography.label}>FOOD ICON</Text>
        <View style={styles.iconGrid}>
          <TouchableOpacity
            style={[styles.iconOption, !icon && styles.iconOptionSelected]}
            onPress={() => setIcon(undefined)}
          >
            <Ionicons name={guessFoodIcon(name)} size={20} color={!icon ? colors.primary : colors.textSecondary} />
            <Text style={[styles.iconOptionLabel, !icon && styles.iconOptionLabelSelected]}>Auto</Text>
          </TouchableOpacity>
          {FOOD_ICON_OPTIONS.map((option) => {
            const selected = icon === option.name;
            return (
              <TouchableOpacity
                key={option.name}
                style={[styles.iconOption, selected && styles.iconOptionSelected]}
                onPress={() => setIcon(option.name)}
              >
                <Ionicons name={option.name} size={20} color={selected ? colors.primary : colors.textSecondary} />
                <Text style={[styles.iconOptionLabel, selected && styles.iconOptionLabelSelected]}>{option.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={typography.label}>NUTRIENTS</Text>
        <View style={styles.chipRow}>
          {NUTRIENTS.map((n) => (
            <Chip key={n} label={NUTRIENT_META[n].label} selected={nutrients.includes(n)} selectedColor={NUTRIENT_META[n].color} onPress={() => toggleNutrient(n)} />
          ))}
        </View>

        <Text style={typography.label}>NOTE (OPTIONAL)</Text>
        <TextInput
          style={styles.input}
          value={note}
          onChangeText={setNote}
          placeholder="e.g. Ella's favourite after swimming"
          placeholderTextColor={colors.textSecondary}
        />

        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={typography.h3}>Veggie portion</Text>
            <Text style={typography.small}>Counts toward weekly veggie goal</Text>
          </View>
          <Switch value={isVeggie} onValueChange={setIsVeggie} trackColor={{ true: colors.tagVeggie, false: colors.border }} />
        </View>

        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={typography.h3}>Fruit portion</Text>
            <Text style={typography.small}>Counts toward weekly fruit goal</Text>
          </View>
          <Switch value={isFruit} onValueChange={setIsFruit} trackColor={{ true: colors.tagFruit, false: colors.border }} />
        </View>

        <View style={styles.switchRow}>
          <Text style={typography.h3}>Add a recipe</Text>
          <Switch value={showRecipe} onValueChange={setShowRecipe} trackColor={{ true: colors.primary, false: colors.border }} />
        </View>

        {showRecipe && (
          <View style={styles.recipeBox}>
            <Text style={typography.label}>PREP TIME (MIN)</Text>
            <TextInput style={styles.input} value={prepTime} onChangeText={setPrepTime} keyboardType="numeric" placeholder="20" placeholderTextColor={colors.textSecondary} />

            <Text style={typography.label}>INGREDIENTS</Text>
            {ingredients.map((ing, i) => (
              <View key={i} style={styles.ingRow}>
                <Text style={typography.body}>
                  • {ing.qty} {ing.name}
                </Text>
                <TouchableOpacity onPress={() => setIngredients((prev) => prev.filter((_, idx) => idx !== i))}>
                  <Text>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            <View style={styles.ingredientFieldsRow}>
              <TextInput style={[styles.input, styles.quantityInput]} placeholder="qty" placeholderTextColor={colors.textSecondary} value={ingQty} onChangeText={setIngQty} />
              <View style={styles.ingredientNameField}>
                <TextInput
                  style={styles.ingredientNameInput}
                  placeholder="Search or add an ingredient"
                  placeholderTextColor={colors.textSecondary}
                  value={ingName}
                  onChangeText={(value) => {
                    setIngName(value);
                    setIngredientSuggestionsVisible(true);
                  }}
                  onFocus={() => setIngredientSuggestionsVisible(true)}
                  onSubmitEditing={addIngredient}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  onPress={() => {
                    setIngredientSuggestionsVisible(false);
                    setIngredientPickerVisible(true);
                  }}
                  style={styles.ingredientListButton}
                  accessibilityLabel="Browse previously used ingredients"
                >
                  <Ionicons name="list-outline" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
            {ingredientSuggestionsVisible && !!normalizedIngredientName && ingredientSuggestions.length > 0 && (
              <View style={styles.ingredientSuggestions}>
                {ingredientSuggestions.map((ingredientName) => (
                  <TouchableOpacity
                    key={normalizeIngredient(ingredientName)}
                    onPress={() => {
                      setIngName(ingredientName);
                      setIngredientSuggestionsVisible(false);
                    }}
                    style={styles.ingredientSuggestion}
                  >
                    <Ionicons name="search-outline" size={14} color={colors.textSecondary} />
                    <Text style={styles.ingredientSuggestionText}>{ingredientName}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {matchingIngredient && <Text style={styles.duplicateIngredientText}>Already added as “{matchingIngredient.name}”</Text>}
            <TouchableOpacity
              onPress={addIngredient}
              disabled={!canAddIngredient}
              style={[styles.addIngredientButton, !canAddIngredient && styles.addIngredientButtonDisabled]}
            >
              <Ionicons name="add" size={16} color={canAddIngredient ? colors.primary : colors.textSecondary} />
              <Text style={[styles.addIngredientButtonText, !canAddIngredient && styles.addIngredientButtonTextDisabled]}>Add ingredient</Text>
            </TouchableOpacity>

            <Text style={typography.label}>STEPS</Text>
            {steps.map((step, i) => (
              <View key={i} style={styles.addIngRow}>
                <TextInput
                  style={[styles.input, { flex: 1, marginRight: 6 }]}
                  value={step}
                  onChangeText={(t) => updateStep(i, t)}
                  placeholder={`Step ${i + 1}`}
                  placeholderTextColor={colors.textSecondary}
                />
                <TouchableOpacity onPress={() => removeStep(i)}>
                  <Text>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity onPress={addStep}>
              <Text style={{ color: colors.primary, fontWeight: '700', marginTop: 4 }}>+ Add step</Text>
            </TouchableOpacity>
          </View>
        )}

        <PillButton label="Save changes" onPress={handleSave} disabled={!name.trim() || suitableFor.length === 0} style={{ marginTop: spacing.xl }} />
        {existing && <PillButton label="Delete food" variant="outline" onPress={handleDelete} style={{ marginTop: spacing.sm }} />}
      </ScrollView>

      <Modal visible={ingredientPickerVisible} transparent animationType="slide" onRequestClose={() => setIngredientPickerVisible(false)}>
        <Pressable style={styles.ingredientPickerBackdrop} onPress={() => setIngredientPickerVisible(false)}>
          <Pressable style={styles.ingredientPickerSheet} onPress={(event) => event.stopPropagation()}>
            <View style={styles.ingredientPickerHandle} />
            <View style={styles.ingredientPickerHeader}>
              <View>
                <Text style={typography.h2}>Previously used ingredients</Text>
                <Text style={typography.small}>Choose one to fill the ingredient field.</Text>
              </View>
              <TouchableOpacity onPress={() => setIngredientPickerVisible(false)} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.ingredientSearchSummary}>
              {normalizedIngredientName ? `Matches for “${ingName.trim()}”` : 'All previously used ingredients'}
            </Text>
            <ScrollView style={styles.ingredientOptionList} keyboardShouldPersistTaps="handled">
              {matchingPreviousIngredients.length > 0 ? (
                matchingPreviousIngredients.map((ingredientName) => {
                  const alreadyAdded = ingredients.some(
                    (ingredient) => normalizeIngredient(ingredient.name) === normalizeIngredient(ingredientName)
                  );
                  return (
                    <TouchableOpacity
                      key={normalizeIngredient(ingredientName)}
                      disabled={alreadyAdded}
                      onPress={() => {
                        setIngName(ingredientName);
                        setIngredientPickerVisible(false);
                      }}
                      style={[styles.ingredientOption, alreadyAdded && styles.ingredientOptionDisabled]}
                    >
                      <Text style={[typography.body, alreadyAdded && styles.ingredientOptionTextDisabled]}>{ingredientName}</Text>
                      {alreadyAdded ? (
                        <Text style={styles.ingredientAlreadyAddedLabel}>Added</Text>
                      ) : (
                        <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                      )}
                    </TouchableOpacity>
                  );
                })
              ) : (
                <Text style={[typography.small, styles.noIngredientOptions]}>
                  {normalizedIngredientName
                    ? `No previously used ingredients match. You can add “${ingName.trim()}” as a new ingredient.`
                    : 'No previously used ingredients yet. Type a name above to add the first one.'}
                </Text>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: spacing.md,
    color: colors.textPrimary,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.md },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.md, gap: spacing.sm },
  iconOption: {
    width: 64,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
  },
  iconOptionSelected: { borderColor: colors.primary, backgroundColor: colors.primaryMuted },
  iconOptionLabel: { fontSize: 9, fontFamily: fontFamily.mono, color: colors.textSecondary, marginTop: 4 },
  iconOptionLabelSelected: { color: colors.primary },
  switchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceMint, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md },
  recipeBox: { backgroundColor: colors.surfaceMint, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md },
  ingRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  addIngRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  ingredientFieldsRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.xs },
  quantityInput: { width: 72, marginRight: spacing.sm },
  ingredientNameField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    marginBottom: spacing.md,
  },
  ingredientNameInput: { flex: 1, paddingLeft: spacing.lg, paddingVertical: 12, fontSize: 15, color: colors.textPrimary },
  ingredientListButton: { paddingHorizontal: spacing.md, paddingVertical: 10 },
  ingredientSuggestions: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, marginBottom: spacing.sm, overflow: 'hidden' },
  ingredientSuggestion: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  ingredientSuggestionText: { fontSize: 13, color: colors.textPrimary },
  duplicateIngredientText: { fontSize: 11, color: colors.warning, marginBottom: spacing.sm },
  addIngredientButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  addIngredientButtonDisabled: { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
  addIngredientButtonText: { fontSize: 11, fontFamily: fontFamily.monoBold, letterSpacing: 0.6, textTransform: 'uppercase', color: colors.primary },
  addIngredientButtonTextDisabled: { color: colors.textSecondary },
  ingredientPickerBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(29, 43, 39, 0.35)' },
  ingredientPickerSheet: {
    maxHeight: '70%',
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  ingredientPickerHandle: { alignSelf: 'center', width: 40, height: 4, borderRadius: radius.pill, backgroundColor: colors.border, marginVertical: spacing.md },
  ingredientPickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  ingredientSearchSummary: { fontSize: 11, fontFamily: fontFamily.mono, color: colors.textSecondary, marginTop: spacing.md, marginBottom: spacing.xs },
  ingredientOptionList: { marginBottom: spacing.sm },
  ingredientOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  ingredientOptionDisabled: { opacity: 0.5 },
  ingredientOptionTextDisabled: { color: colors.textSecondary },
  ingredientAlreadyAddedLabel: { fontSize: 10, fontFamily: fontFamily.monoBold, color: colors.textSecondary, textTransform: 'uppercase' },
  noIngredientOptions: { paddingVertical: spacing.lg, textAlign: 'center' },
});
