import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useFoodStore } from '../../store/useFoodStore';
import { Chip } from '../../components/Chip';
import { colors, spacing, typography, radius, fontFamily } from '../../theme';
import { NUTRIENT_META, EFFORT_META, guessFoodIcon } from '../../constants';
import { AgeGroup, Effort } from '../../types';

type FilterValue = 'all' | AgeGroup | Effort;

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'toddler', label: 'Toddler' },
  { value: 'adult', label: 'Adult' },
  { value: 'quick', label: 'Quick' },
  { value: 'medium', label: 'Medium' },
  { value: 'tedious', label: 'Tedious' },
];

export function FoodLibraryScreen() {
  const navigation = useNavigation<any>();
  const foods = useFoodStore((s) => s.foods);
  const removeFood = useFoodStore((s) => s.removeFood);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterValue>('all');

  const filtered = useMemo(() => {
    return foods.filter((f) => {
      if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (filter === 'all') return true;
      if (filter === 'toddler' || filter === 'adult') return f.suitableFor.includes(filter);
      return f.effort === filter;
    });
  }, [foods, search, filter]);

  const confirmDelete = (foodId: string, foodName: string) => {
    Alert.alert('Delete food?', `Are you sure you want to delete “${foodName}”?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeFood(foodId) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={typography.h1}>Food Library</Text>
        <TouchableOpacity style={styles.newBtn} onPress={() => navigation.navigate('FoodEdit', {})}>
          <Ionicons name="add" size={14} color={colors.primary} />
          <Text style={styles.newBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <Ionicons name="search" size={15} color={colors.textSecondary} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search foods or recipes..."
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ paddingHorizontal: spacing.lg }}>
        {FILTERS.map((f) => (
          <Chip key={f.value} label={f.label} selected={filter === f.value} onPress={() => setFilter(f.value)} />
        ))}
      </ScrollView>

      <FlatList
        style={styles.foodList}
        data={filtered}
        keyExtractor={(f) => f.id}
        contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.sm }}
        renderItem={({ item }) => {
          const isShared = item.suitableFor.includes('toddler') && item.suitableFor.includes('adult');
          return (
            <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('FoodEdit', { foodId: item.id })}>
              <View style={styles.iconTile}>
                <Ionicons name={item.icon ?? guessFoodIcon(item.name)} size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <View style={styles.cardTopRow}>
                  <Text style={styles.foodName} numberOfLines={1}>
                    {item.name.toUpperCase()}
                  </Text>
                  <Text style={styles.effortLabel}>{EFFORT_META[item.effort].label.toUpperCase()}</Text>
                </View>
                <View style={styles.chipRow}>
                  {isShared ? (
                    <Chip label="Shared" />
                  ) : (
                    item.suitableFor.map((a) => <Chip key={a} label={a === 'toddler' ? 'Toddler' : 'Adult'} />)
                  )}
                  {item.isVeggiePortion && <Chip label="Veggie" />}
                  {item.isFruitPortion && <Chip label="Fruit" />}
                  {item.nutrients.map((n) => (
                    <Chip key={n} label={NUTRIENT_META[n].label} />
                  ))}
                </View>
                {!!item.note && <Text style={styles.foodNote} numberOfLines={1}>{item.note}</Text>}
              </View>
              <TouchableOpacity onPress={() => confirmDelete(item.id, item.name)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={{ marginLeft: 4 }}>
                <Ionicons name="trash-outline" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={<Text style={[typography.small, { padding: spacing.lg, textAlign: 'center' }]}>No foods match — try a different filter.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg },
  newBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  newBtnText: { fontSize: 12, fontFamily: fontFamily.monoBold, letterSpacing: 0.6, textTransform: 'uppercase', color: colors.primary },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    marginBottom: spacing.md,
  },
  searchInput: { flex: 1, color: colors.textPrimary, fontSize: 13, fontFamily: fontFamily.mono },
  // Keep the quick filters in a fixed row above the independently scrollable list.
  filterRow: { flexGrow: 0, flexShrink: 0, marginBottom: spacing.md },
  foodList: { flex: 1, minHeight: 0 },
  card: { flexDirection: 'row', backgroundColor: colors.surfaceMint, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md, alignItems: 'flex-start' },
  iconTile: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  foodName: { flex: 1, fontSize: 13, fontFamily: fontFamily.monoBold, letterSpacing: 0.3, color: colors.textPrimary, marginRight: spacing.sm },
  effortLabel: { fontSize: 9, fontFamily: fontFamily.mono, color: colors.textSecondary, letterSpacing: 0.4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  foodNote: { fontSize: 11, fontStyle: 'italic', color: colors.textSecondary, marginTop: spacing.xs },
});
