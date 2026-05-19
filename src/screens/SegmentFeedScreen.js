import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image,
  TouchableOpacity, SafeAreaView, ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { getToken, clearToken } from '../utils/storage';
import { fetchSegmentVideos, AuthError } from '../utils/youtube';
import { colors, spacing } from '../theme';

const formatDuration = (s) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    return `${h}:${String(m % 60).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }
  return `${m}:${String(sec).padStart(2, '0')}`;
};

const timeAgo = (iso) => {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d >= 30) return `${Math.floor(d / 30)}mo ago`;
  if (d >= 1) return `${d}d ago`;
  const h = Math.floor(diff / 3600000);
  if (h >= 1) return `${h}h ago`;
  return 'just now';
};

export default function SegmentFeedScreen({ route, navigation }) {
  const { segment } = route.params;
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    navigation.setOptions({ title: segment.name });
  }, [navigation, segment.name]);

  const load = useCallback(async () => {
    setError(null);
    try {
      const token = await getToken();
      if (!token) {
        navigation.replace('SignIn');
        return;
      }
      const results = await fetchSegmentVideos(token.accessToken, segment.keywords);
      setVideos(results);
    } catch (e) {
      if (e instanceof AuthError) {
        await clearToken();
        navigation.replace('SignIn');
        return;
      }
      setError(e.message || 'Failed to load videos.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [segment.keywords, navigation]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator color={colors.accent} size="large" />
        <Text style={styles.statusText}>Scanning your subscriptions…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={videos}
        keyExtractor={(v) => v.id}
        contentContainerStyle={videos.length === 0 ? styles.emptyList : styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyTitle}>
              {error ? 'Something went wrong.' : 'No matching videos yet.'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {error || 'Try different keywords or check back later.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('VideoPlayer', { video: item })}
          >
            <View style={styles.thumbWrap}>
              {item.thumbnail && (
                <Image source={{ uri: item.thumbnail }} style={styles.thumb} />
              )}
              <View style={styles.durationBadge}>
                <Text style={styles.durationText}>
                  {formatDuration(item.durationSeconds)}
                </Text>
              </View>
            </View>
            <View style={styles.meta}>
              <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.sub}>
                {item.channelTitle} · {timeAgo(item.publishedAt)}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  statusText: { color: colors.textSecondary, marginTop: spacing.md, fontSize: 14 },
  list: { padding: spacing.md },
  emptyList: { flexGrow: 1 },
  emptyTitle: {
    color: colors.text, fontSize: 18, fontWeight: '700',
    textAlign: 'center', marginBottom: spacing.sm,
  },
  emptySubtitle: { color: colors.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  card: { marginBottom: spacing.lg },
  thumbWrap: { position: 'relative', borderRadius: 12, overflow: 'hidden' },
  thumb: { width: '100%', aspectRatio: 16 / 9, backgroundColor: colors.surface },
  durationBadge: {
    position: 'absolute', bottom: 8, right: 8,
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  durationText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  meta: { paddingTop: spacing.sm },
  title: { color: colors.text, fontSize: 15, fontWeight: '600', lineHeight: 20 },
  sub: { color: colors.textSecondary, fontSize: 13, marginTop: 4 },
});
