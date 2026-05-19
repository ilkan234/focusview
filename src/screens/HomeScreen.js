import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, SafeAreaView, StatusBar
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getSegments } from '../utils/storage';
import { colors, spacing } from '../theme';

export default function HomeScreen({ navigation }) {
  const [segments, setSegments] = useState([]);

  useFocusEffect(
    useCallback(() => {
      getSegments().then(setSegments);
    }, [])
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <Text style={styles.logo}>focusview</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateSegment')}
        >
          <Text style={styles.addButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {segments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Your space is empty.</Text>
          <Text style={styles.emptySubtitle}>
            Create a segment to start watching focused content.
          </Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => navigation.navigate('CreateSegment')}
          >
            <Text style={styles.createButtonText}>Create First Segment</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={segments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('SegmentFeed', { segment: item })}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.cardName}>{item.name}</Text>
                <Text style={styles.cardKeywords}>{item.keywords.join(' · ')}</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: spacing.md,
    paddingVertical: spacing.md, borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logo: { color: colors.text, fontSize: 22, fontWeight: '700', letterSpacing: 1 },
  addButton: {
    backgroundColor: colors.accent, paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm, borderRadius: 20,
  },
  addButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  emptyContainer: {
    flex: 1, justifyContent: 'center',
    alignItems: 'center', paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    color: colors.text, fontSize: 26, fontWeight: '700',
    textAlign: 'center', marginBottom: spacing.sm,
  },
  emptySubtitle: {
    color: colors.textSecondary, fontSize: 15,
    textAlign: 'center', lineHeight: 22, marginBottom: spacing.xl,
  },
  createButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: 30,
  },
  createButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  list: { padding: spacing.md },
  card: {
    backgroundColor: colors.surface, borderRadius: 12,
    padding: spacing.md, marginBottom: spacing.sm,
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  cardName: { color: colors.text, fontSize: 17, fontWeight: '600', marginBottom: 4 },
  cardKeywords: { color: colors.textSecondary, fontSize: 13 },
  arrow: { color: colors.textSecondary, fontSize: 24 },
});