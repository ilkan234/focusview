import React, { useState, useLayoutEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput,
  TouchableOpacity, SafeAreaView, ScrollView, Alert
} from 'react-native';
import { addSegment, updateSegment } from '../utils/storage';
import { colors, spacing } from '../theme';

export default function CreateSegmentScreen({ navigation, route }) {
  const editingSegment = route.params?.segment;
  const isEditing = !!editingSegment;

  const [name, setName] = useState(editingSegment?.name ?? '');
  const [keywordInput, setKeywordInput] = useState('');
  const [keywords, setKeywords] = useState(editingSegment?.keywords ?? []);

  useLayoutEffect(() => {
    navigation.setOptions({ title: isEditing ? 'Edit Segment' : 'New Segment' });
  }, [navigation, isEditing]);

  const addKeyword = () => {
    const trimmed = keywordInput.trim().toLowerCase();
    if (!trimmed || keywords.includes(trimmed)) { setKeywordInput(''); return; }
    setKeywords([...keywords, trimmed]);
    setKeywordInput('');
  };

  const handleSave = async () => {
    if (!name.trim()) return Alert.alert('Name required', 'Give your segment a name.');
    if (keywords.length === 0) return Alert.alert('Keywords required', 'Add at least one keyword.');
    if (isEditing) {
      await updateSegment(editingSegment.id, { name: name.trim(), keywords });
    } else {
      await addSegment({ name: name.trim(), keywords });
    }
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <Text style={styles.label}>Segment Name</Text>
        <TextInput
          style={styles.input} placeholder="e.g. Machine Learning"
          placeholderTextColor={colors.textMuted}
          value={name} onChangeText={setName}
        />

        <Text style={styles.label}>Keywords</Text>
        <Text style={styles.hint}>
          Videos whose title contains these words will appear in this segment.
        </Text>

        <View style={styles.row}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            placeholder="e.g. neural network"
            placeholderTextColor={colors.textMuted}
            value={keywordInput} onChangeText={setKeywordInput}
            onSubmitEditing={addKeyword} returnKeyType="done"
          />
          <TouchableOpacity style={styles.addKwBtn} onPress={addKeyword}>
            <Text style={styles.addKwText}>Add</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.chips}>
          {keywords.map((kw) => (
            <TouchableOpacity
              key={kw} style={styles.chip}
              onPress={() => setKeywords(keywords.filter(k => k !== kw))}
            >
              <Text style={styles.chipText}>{kw} ×</Text>
            </TouchableOpacity>
          ))}
        </View>

        {keywords.length > 0 && <Text style={styles.hint}>Tap a keyword to remove it.</Text>}

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>{isEditing ? 'Update Segment' : 'Save Segment'}</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.md },
  label: { color: colors.text, fontSize: 16, fontWeight: '600', marginTop: spacing.lg, marginBottom: spacing.sm },
  hint: { color: colors.textSecondary, fontSize: 13, marginBottom: spacing.sm, lineHeight: 18 },
  input: {
    backgroundColor: colors.surface, color: colors.text,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: 10, padding: spacing.md, fontSize: 15, marginBottom: spacing.sm,
  },
  row: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  addKwBtn: {
    backgroundColor: colors.accent, paddingHorizontal: spacing.md,
    borderRadius: 10, justifyContent: 'center',
  },
  addKwText: { color: '#fff', fontWeight: '600' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginVertical: spacing.sm },
  chip: {
    backgroundColor: colors.surface, borderWidth: 1,
    borderColor: colors.accent, borderRadius: 20,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
  },
  chipText: { color: colors.accent, fontSize: 13 },
  saveBtn: {
    backgroundColor: colors.accent, borderRadius: 30,
    padding: spacing.md, alignItems: 'center', marginTop: spacing.xl,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});