import React, { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Switch } from 'react-native';
import { BottomSheetModal, BottomSheetView, BottomSheetTextInput, BottomSheetBackdrop, BottomSheetFlatList } from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { useFoodStore } from '../../store/useFoodStore';
import { Chip } from '../../components/Chip';
import { PillButton } from '../../components/PillButton';
import { colors, spacing, typography, radius, fontFamily } from '../../theme';
import { FamilyMember, Food, FoodEntry, Nutrient, Effort } from '../../types';
import { NUTRIENT_META, EFFORT_META } from '../../constants';
import { generateId } from '../../lib/id';
import * as Haptics from 'expo-haptics';

export interface FoodPickerSheetHandle {
  open: (familyMember: FamilyMember, onSelect: (entry: FoodEntry) => void, prioritizedFoodIds?: string[]) => void;
}

const EFFORTS: Effort[] = ['quick', 'medium', 'tedious'];
const NUTRIENTS: Nutrient[] = ['protein', 'calcium', 'vitC', 'iron'];

// A single, always-mounted bottom sheet controlled imperatively via ref.open(...).
// Real drag-to-dismiss, a 70%-height default snap point (92% max), native-thread
// animation via Reanimated.
//
// Layout is a fixed header + flexible scrollable list + fixed footer:
// the food list uses BottomSheetFlatList (not a plain FlatList — a plain
// FlatList's own pan responder fights the sheet's drag gesture for the same
// vertical axis, which is what made the list feel unscrollable) with flex:1,
// so it expands to fill whatever space is left between the header and the
// quick-add footer at whatever snap point the sheet is at — more sheet
// height means more visible library results, and quick-add always stays
// pinned at the bottom rather than scrolling away.
export const FoodPickerSheet = forwardRef<FoodPickerSheetHandle, {}>((_props, ref) => {
  const sheetRef = useRef<BottomSheetModal>(null);
  const foods = useFoodStore((s) => s.foods);
  const addFood = useFoodStore((s) => s.addFood);

  const [familyMember, setFamilyMember] = useState<FamilyMember | null>(null);
  const onSelectRef = useRef<(entry: FoodEntry) => void>(() => {});
  const [prioritizedFoodIds, setPrioritizedFoodIds] = useState<string[]>([]);

  const [search, setSearch] = useState('');
  const [effortFilter, setEffortFilter] = useState<Effort | null>(null);
  const [ageFilterOn, setAgeFilterOn] = useState(true);

  const [quickName, setQuickName] = useState('');
  const [quickNote, setQuickNote] = useState('');
  const [quickNutrients, setQuickNutrients] = useState<Nutrient[]>([]);
  const [quickVeggie, setQuickVeggie] = useState(false);
  const [quickFruit, setQuickFruit] = useState(false);
  const [saveToLibrary, setSaveToLibrary] = useState(false);

  const snapPoints = useMemo(() => ['70%', '92%'], []);

  useImperativeHandle(ref, () => ({
    open: (member, onSelect, priorityFoodIds = []) => {
      setFamilyMember(member);
      onSelectRef.current = onSelect;
      setPrioritizedFoodIds(priorityFoodIds);
      setSearch('');
      setEffortFilter(null);
      setAgeFilterOn(true);
      resetQuickAdd();
      sheetRef.current?.present();
    },
  }));

  const resetQuickAdd = () => {
    setQuickName('');
    setQuickNote('');
    setQuickNutrients([]);
    setQuickVeggie(false);
    setQuickFruit(false);
    setSaveToLibrary(false);
  };

  const ageGroup = familyMember?.ageGroup ?? 'adult';

  const filtered = useMemo(() => {
    const priorityIds = new Set(prioritizedFoodIds);
    return foods
      .filter((f) => {
        // A food already chosen for another family member is kept visible so it can be shared,
        // even when the age filter would ordinarily hide it.
        if (ageFilterOn && !f.suitableFor.includes(ageGroup) && !priorityIds.has(f.id)) return false;
        if (effortFilter && f.effort !== effortFilter) return false;
        if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => Number(priorityIds.has(b.id)) - Number(priorityIds.has(a.id)) || a.name.localeCompare(b.name));
  }, [foods, ageGroup, ageFilterOn, effortFilter, search, prioritizedFoodIds]);

  const handlePickLibraryFood = (food: Food) => {
    onSelectRef.current({ id: generateId('entry_'), source: 'library', foodId: food.id });
    sheetRef.current?.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const toggleQuickNutrient = (n: Nutrient) => {
    setQuickNutrients((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]));
  };

  const handleQuickAdd = () => {
    if (!quickName.trim() || !familyMember) return;

    if (saveToLibrary) {
      const newFood = addFood({
        name: quickName.trim(),
        suitableFor: [familyMember.ageGroup],
        effort: 'quick',
        nutrients: quickNutrients,
        isVeggiePortion: quickVeggie,
        isFruitPortion: quickFruit,
        note: quickNote.trim() || undefined,
      });
      onSelectRef.current({ id: generateId('entry_'), source: 'library', foodId: newFood.id });
    } else {
      onSelectRef.current({
        id: generateId('entry_'),
        source: 'adhoc',
        adhoc: {
          name: quickName.trim(),
          nutrients: quickNutrients,
          isVeggiePortion: quickVeggie,
          isFruitPortion: quickFruit,
        },
      });
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    resetQuickAdd();
    sheetRef.current?.dismiss();
  };

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.35} pressBehavior="close" />
    ),
    []
  );

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      index={0}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={styles.handleIndicator}
      backgroundStyle={styles.sheetBackground}
    >
      <BottomSheetView style={styles.content}>
        <View>
          <Text style={typography.h2}>Add food for {familyMember?.name ?? ''}</Text>

          <BottomSheetTextInput
            style={styles.search}
            placeholder="Search foods..."
            placeholderTextColor={colors.textSecondary}
            value={search}
            onChangeText={setSearch}
          />

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.xs }}>
            <Chip
              label={ageGroup === 'toddler' ? 'Toddler-friendly' : 'Adult'}
              selected={ageFilterOn}
              onPress={() => setAgeFilterOn((v) => !v)}
              selectedColor={colors.primary}
            />
            {EFFORTS.map((e) => (
              <Chip
                key={e}
                label={EFFORT_META[e].label}
                selected={effortFilter === e}
                selectedColor={EFFORT_META[e].color}
                onPress={() => setEffortFilter((prev) => (prev === e ? null : e))}
              />
            ))}
          </ScrollView>
        </View>

        <BottomSheetFlatList
          data={filtered}
          keyExtractor={(f) => f.id}
          style={styles.list}
          contentContainerStyle={{ paddingBottom: spacing.sm }}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.foodRow} onPress={() => handlePickLibraryFood(item)}>
              <View style={{ flex: 1 }}>
                <Text style={typography.body}>{item.name}</Text>
                {prioritizedFoodIds.includes(item.id) && <Text style={styles.sharedChoiceLabel}>Selected for another family member</Text>}
              </View>
              <Text style={typography.small}>{EFFORT_META[item.effort].label}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={[typography.small, { padding: spacing.md }]}>No foods match — try the quick add below.</Text>
          }
        />

        <View style={styles.quickAdd}>
          <Text style={typography.label}>QUICK ADD (ONE-OFF)</Text>
          <BottomSheetTextInput
            style={styles.search}
            placeholder="e.g. leftover pasta"
            placeholderTextColor={colors.textSecondary}
            value={quickName}
            onChangeText={setQuickName}
          />
          {saveToLibrary && (
            <BottomSheetTextInput
              style={styles.quickNoteInput}
              placeholder="Optional food note"
              placeholderTextColor={colors.textSecondary}
              value={quickNote}
              onChangeText={setQuickNote}
            />
          )}
          <View style={styles.chipWrap}>
            {NUTRIENTS.map((n) => (
              <Chip
                key={n}
                label={NUTRIENT_META[n].label}
                selected={quickNutrients.includes(n)}
                selectedColor={NUTRIENT_META[n].color}
                onPress={() => toggleQuickNutrient(n)}
              />
            ))}
            <Chip label="Veggie" selected={quickVeggie} selectedColor={colors.tagVeggie} onPress={() => setQuickVeggie((v) => !v)} />
            <Chip label="Fruit" selected={quickFruit} selectedColor={colors.tagFruit} onPress={() => setQuickFruit((v) => !v)} />
          </View>
          <View style={styles.saveRow}>
            <Text style={typography.small}>Save to Food Library too</Text>
            <Switch value={saveToLibrary} onValueChange={setSaveToLibrary} trackColor={{ true: colors.primary, false: colors.border }} />
          </View>
          <PillButton label="Add to meal" onPress={handleQuickAdd} disabled={!quickName.trim()} />
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
});

FoodPickerSheet.displayName = 'FoodPickerSheet';

const styles = StyleSheet.create({
  sheetBackground: { backgroundColor: colors.background, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl },
  handleIndicator: { backgroundColor: colors.border, width: 40 },
  content: { flex: 1, paddingHorizontal: spacing.lg },
  search: {
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: fontFamily.mono,
    marginVertical: spacing.sm,
    color: colors.textPrimary,
  },
  list: { flex: 1 },
  foodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sharedChoiceLabel: { fontSize: 10, fontFamily: fontFamily.mono, color: colors.primary, marginTop: 2 },
  quickAdd: {
    marginTop: spacing.sm,
    backgroundColor: colors.surfaceMint,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  quickNoteInput: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 12,
    fontFamily: fontFamily.mono,
    marginBottom: spacing.sm,
    color: colors.textPrimary,
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.xs },
  saveRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: spacing.sm },
});
