import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  useWindowDimensions, Alert,
} from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { colors, spacing } from '../theme';

const formatDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString();
};

export default function VideoPlayerScreen({ route, navigation }) {
  const { video } = route.params;
  const { width } = useWindowDimensions();
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    navigation.setOptions({ title: video.channelTitle || 'Playing' });
  }, [navigation, video.channelTitle]);

  const onStateChange = useCallback((state) => {
    if (state === 'ended') setPlaying(false);
  }, []);

  const onError = useCallback((err) => {
    Alert.alert(
      'Playback error',
      `YouTube refused to play this video in-app (${err}). It may have embedding disabled by the uploader.`,
    );
  }, []);

  return (
    <View style={styles.container}>
      <View style={{ width, height: (width * 9) / 16, backgroundColor: '#000' }}>
        <YoutubePlayer
          height={(width * 9) / 16}
          width={width}
          videoId={video.id}
          play={playing}
          onChangeState={onStateChange}
          onError={onError}
          webViewProps={{
            allowsFullscreenVideo: true,
            allowsInlineMediaPlayback: true,
            mediaPlaybackRequiresUserAction: false,
          }}
          initialPlayerParams={{
            modestbranding: true,
            rel: 0,
            preventFullScreen: false,
          }}
        />
      </View>

      <ScrollView contentContainerStyle={styles.meta}>
        <Text style={styles.title}>{video.title}</Text>
        <Text style={styles.sub}>
          {video.channelTitle}
          {video.publishedAt ? `  ·  ${formatDate(video.publishedAt)}` : ''}
        </Text>
        {video.description ? (
          <Text style={styles.description} numberOfLines={8}>
            {video.description}
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  meta: { padding: spacing.md },
  title: {
    color: colors.text, fontSize: 16, fontWeight: '700',
    lineHeight: 22, marginBottom: spacing.xs,
  },
  sub: { color: colors.textSecondary, fontSize: 13, marginBottom: spacing.md },
  description: {
    color: colors.textSecondary, fontSize: 13, lineHeight: 19,
  },
});
