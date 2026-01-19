import { StatusBar } from 'expo-status-bar';
import { Text, View, ScrollView, TouchableOpacity, TextInput, Modal, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect } from 'react';

const CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert'];

// Types
type Recipe = {
  id: string;
  title: string;
  image: string | null;
  category: string;
  servings: string;
  prepTime: string;
  cookTime: string;
  description: string;
  ingredients: string;
  instructions: string;
};

const STORAGE_KEY = '@food_recipes_data';

export default function App() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [view, setView] = useState<'LIST' | 'ADD' | 'DETAIL'>('LIST');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [form, setForm] = useState<Partial<Recipe>>({});

  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
      if (jsonValue != null) {
        setRecipes(JSON.parse(jsonValue));
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to load recipes");
    } finally {
      setLoading(false);
    }
  };

  const saveRecipesToStorage = async (newRecipes: Recipe[]) => {
    try {
      const jsonValue = JSON.stringify(newRecipes);
      await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
      setRecipes(newRecipes);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to save recipe");
    }
  };

  const handlePickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled) {
      setForm({ ...form, image: result.assets[0].uri });
    }
  };

  const handleSave = () => {
    if (!form.title || !form.ingredients) {
      Alert.alert("Missing Fields", "Title and Ingredients are required.");
      return;
    }

    const newRecipe: Recipe = {
      id: Date.now().toString(),
      title: form.title || '',
      image: form.image || null,
      category: form.category || 'General',
      servings: form.servings || '',
      prepTime: form.prepTime || '',
      cookTime: form.cookTime || '',
      description: form.description || '',
      ingredients: form.ingredients || '',
      instructions: form.instructions || '',
    };

    const updated = [newRecipe, ...recipes];
    saveRecipesToStorage(updated);
    setForm({});
    setView('LIST');
  };

  const handleDelete = async (id: string) => {
    const updated = recipes.filter(r => r.id !== id);
    await saveRecipesToStorage(updated);
    if (selectedRecipe?.id === id) {
      setSelectedRecipe(null);
      setView('LIST');
    }
  };

  const openDetail = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setView('DETAIL');
  };

  const renderList = () => (
    <View style={styles.flex1}>
      <Text style={styles.title}>My Recipes</Text>
      <ScrollView style={styles.paddingHorizontal}>
        {recipes.length === 0 ? (
          <Text style={styles.emptyText}>No recipes yet. Tap + to add.</Text>
        ) : (
          recipes.map(recipe => (
            <TouchableOpacity
              key={recipe.id}
              onPress={() => openDetail(recipe)}
              style={styles.card}
            >
              {recipe.image ? (
                <Image source={{ uri: recipe.image }} style={styles.cardImage} contentFit="cover" />
              ) : (
                <View style={[styles.cardImage, styles.noImage]}>
                  <Text style={styles.noImageText}>No Image</Text>
                </View>
              )}
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{recipe.title}</Text>
                <Text style={styles.cardCategory}>{recipe.category}</Text>
                <View style={styles.cardMeta}>
                  <Text style={styles.metaText}>⏱ {recipe.prepTime || '-'} prep</Text>
                  <Text style={styles.metaText}>🔥 {recipe.cookTime || '-'} cook</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 96 }} />
      </ScrollView>
      <TouchableOpacity
        onPress={() => { setForm({}); setView('ADD'); }}
        style={styles.fab}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );

  const renderAdd = () => (
    <View style={styles.flex1}>
      <ScrollView style={[styles.flex1, styles.bgGray50, styles.paddingTop, styles.paddingHorizontal]}>
        <Text style={[styles.sectionTitle, { marginBottom: 24 }]}>New Recipe</Text>

        <TouchableOpacity onPress={handlePickImage} style={styles.imagePicker}>
          {form.image ? (
            <Image source={{ uri: form.image }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
          ) : (
            <Text style={styles.imagePickerText}>+ Add Photo</Text>
          )}
        </TouchableOpacity>

        <View style={styles.formSection}>
          <TextInput placeholder="Recipe Title (e.g. Pasta)" style={[styles.input, styles.inputBold]} value={form.title} onChangeText={t => setForm({ ...form, title: t })} />

          {/* Category Selector */}
          <Text style={[styles.label, { marginTop: 16 }]}>Category</Text>
          <View style={styles.categoryContainer}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                onPress={() => setForm({ ...form, category: cat })}
                style={[
                  styles.categoryChip,
                  form.category === cat ? styles.categoryChipSelected : styles.categoryChipUnselected
                ]}
              >
                <Text style={[
                  styles.categoryChipText,
                  form.category === cat ? styles.categoryTextSelected : styles.categoryTextUnselected
                ]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={[styles.rowGap, { marginTop: 16 }]}>
            <TextInput placeholder="Servings" style={[styles.input, styles.flex1]} value={form.servings} onChangeText={t => setForm({ ...form, servings: t })} />
            <TextInput placeholder="Prep Time" style={[styles.input, styles.flex1]} value={form.prepTime} onChangeText={t => setForm({ ...form, prepTime: t })} />
            <TextInput placeholder="Cook Time" style={[styles.input, styles.flex1]} value={form.cookTime} onChangeText={t => setForm({ ...form, cookTime: t })} />
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Description</Text>
          <TextInput multiline style={[styles.textArea, { height: 80 }]} placeholder="Short description..." value={form.description} onChangeText={t => setForm({ ...form, description: t })} />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Ingredients</Text>
          <TextInput multiline style={[styles.textArea, { height: 128 }]} placeholder="- 2 eggs..." value={form.ingredients} onChangeText={t => setForm({ ...form, ingredients: t })} />
        </View>

        <View style={[styles.formSection, { marginBottom: 32 }]}>
          <Text style={styles.label}>Instructions</Text>
          <TextInput multiline style={[styles.textArea, { height: 160 }]} placeholder="1. Mix everything..." value={form.instructions} onChangeText={t => setForm({ ...form, instructions: t })} />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity onPress={() => setView('LIST')} style={[styles.button, styles.buttonGray]}>
          <Text style={styles.buttonTextGray}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSave} style={[styles.button, styles.buttonOrange]}>
          <Text style={styles.buttonTextWhite}>Save Recipe</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderDetail = () => {
    if (!selectedRecipe) return null;
    return (
      <View style={[styles.flex1, styles.bgWhite]}>
        <ScrollView style={styles.flex1}>
          {selectedRecipe.image && (
            <Image source={{ uri: selectedRecipe.image }} style={{ width: '100%', height: 300 }} contentFit="cover" />
          )}
          <View style={styles.detailContent}>
            <Text style={styles.detailTitle}>{selectedRecipe.title}</Text>
            <View style={styles.tagsRow}>
              <View style={styles.tagOrange}><Text style={styles.tagTextOrange}>{selectedRecipe.category}</Text></View>
              <View style={styles.tagGray}><Text style={styles.tagTextGray}>👥 {selectedRecipe.servings}</Text></View>
              <View style={styles.tagGray}><Text style={styles.tagTextGray}>⏱ {selectedRecipe.prepTime}</Text></View>
              <View style={styles.tagGray}><Text style={styles.tagTextGray}>🔥 {selectedRecipe.cookTime}</Text></View>
            </View>

            {selectedRecipe.description ? (
              <Text style={styles.description}>{selectedRecipe.description}</Text>
            ) : null}

            <Text style={styles.sectionHeader}>Ingredients</Text>
            <Text style={styles.bodyText}>{selectedRecipe.ingredients}</Text>

            <Text style={styles.sectionHeader}>Instructions</Text>
            <Text style={styles.bodyText}>{selectedRecipe.instructions}</Text>
          </View>
        </ScrollView>

        <View style={styles.detailFooter}>
          <TouchableOpacity onPress={() => setView('LIST')} style={[styles.button, styles.buttonGray, styles.flex1]}>
            <Text style={styles.buttonTextGray}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => Alert.alert("Delete", "Are you sure?", [{ text: "Cancel" }, { text: "Delete", style: 'destructive', onPress: () => handleDelete(selectedRecipe.id) }])}
            style={styles.deleteButton}
          >
            <Text style={styles.deleteButtonText}>🗑</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color="#f97316" /></View>;

  return (
    <View style={[styles.flex1, styles.bgGray50]}>
      <StatusBar style="dark" />
      {view === 'LIST' && renderList()}
      {view === 'ADD' && renderAdd()}
      {view === 'DETAIL' && renderDetail()}
    </View>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  bgGray50: { backgroundColor: '#f9fafb' }, // gray-50
  bgWhite: { backgroundColor: 'white' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  paddingHorizontal: { paddingHorizontal: 16 },
  paddingTop: { paddingTop: 48 },

  title: {
    fontSize: 30, // 3xl
    fontWeight: 'bold',
    color: '#1f2937', // gray-800
    marginBottom: 16,
    paddingHorizontal: 16,
    marginTop: 48,
  },
  emptyText: {
    color: '#9ca3af', // gray-400
    textAlign: 'center',
    marginTop: 40,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f3f4f6', // gray-100
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardImage: {
    width: '100%',
    height: 150,
  },
  noImage: {
    backgroundColor: '#e5e7eb', // gray-200
    alignItems: 'center',
    justifyContent: 'center',
  },
  noImageText: { color: '#9ca3af' },
  cardContent: { padding: 16 },
  cardTitle: {
    fontSize: 20, // xl
    fontWeight: 'bold',
    color: '#1f2937', // gray-800
  },
  cardCategory: {
    color: '#f97316', // orange-500
    fontWeight: '500',
  },
  cardMeta: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  metaText: {
    fontSize: 12, // xs
    color: '#6b7280', // gray-500
  },
  fab: {
    position: 'absolute',
    bottom: 40,
    right: 24,
    backgroundColor: '#f97316', // orange-500
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  fabText: {
    color: 'white',
    fontSize: 30,
    fontWeight: 'bold',
  },

  // Add Form
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryChipUnselected: {
    borderColor: '#e5e7eb', // gray-200
    backgroundColor: '#f9fafb', // gray-50
  },
  categoryChipSelected: {
    borderColor: '#f97316', // orange-500
    backgroundColor: '#ffedd5', // orange-100
  },
  categoryChipText: {
    fontWeight: '600',
    fontSize: 14,
  },
  categoryTextUnselected: {
    color: '#6b7280', // gray-500
  },
  categoryTextSelected: {
    color: '#ea580c', // orange-600
  },
  sectionTitle: {
    fontSize: 24, // 2xl
    fontWeight: 'bold',
    color: '#1f2937', // gray-800
  },
  imagePicker: {
    width: '100%',
    height: 192, // h-48
    backgroundColor: '#e5e7eb', // gray-200
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  imagePickerText: {
    color: '#6b7280', // gray-500
    fontWeight: 'bold',
  },
  formSection: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 16,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6', // gray-100
    paddingVertical: 8,
  },
  inputBold: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  rowGap: { flexDirection: 'row', gap: 16 },
  label: {
    fontWeight: 'bold',
    color: '#374151', // gray-700
    marginBottom: 8,
  },
  textArea: {
    textAlignVertical: 'top',
    color: '#4b5563', // gray-600
  },
  footer: {
    padding: 16,
    paddingBottom: 24, // Lift buttons up
    backgroundColor: '#f9fafb', // gray-50
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb', // gray-200
    flexDirection: 'row',
    gap: 16,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
  },
  buttonGray: { backgroundColor: '#d1d5db' }, // gray-300
  buttonOrange: { backgroundColor: '#ea580c' }, // orange-600
  buttonTextGray: { textAlign: 'center', fontWeight: 'bold', color: '#374151' },
  buttonTextWhite: { textAlign: 'center', fontWeight: 'bold', color: 'white' },

  // Detail
  detailContent: { padding: 24 },
  detailTitle: {
    fontSize: 30, // 3xl
    fontWeight: 'bold',
    color: '#111827', // gray-900
    marginBottom: 8,
  },
  tagsRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  tagOrange: { backgroundColor: '#ffedd5', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 9999 },
  tagGray: { backgroundColor: '#f3f4f6', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 9999 },
  tagTextOrange: { color: '#ea580c', fontWeight: 'bold', fontSize: 12 },
  tagTextGray: { color: '#4b5563', fontWeight: 'bold', fontSize: 12 },
  description: {
    color: '#4b5563', // gray-600
    fontStyle: 'italic',
    marginBottom: 24,
    lineHeight: 24,
  },
  sectionHeader: {
    fontSize: 20, // xl
    fontWeight: 'bold',
    color: '#1f2937', // gray-800
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingBottom: 8,
  },
  bodyText: {
    color: '#374151', // gray-700
    marginBottom: 32, // mb-8 / mb-10
    lineHeight: 28,
  },
  detailFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    flexDirection: 'row',
    gap: 16,
    paddingBottom: 32,
  },
  deleteButton: {
    backgroundColor: '#fef2f2', // red-50
    padding: 16,
    borderRadius: 12,
    width: 64,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#ef4444', // red-500
    fontWeight: 'bold',
  },
});
