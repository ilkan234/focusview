import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { colors } from '../theme';

export default function VideoPlayerScreen({ route, navigation }) {
  const { video } = route.params;

  useEffect(() => {
    navigation.setOptions({ title: video.title });
  }, [navigation, video.title]);

  // playsinline=1 keeps the player inside the WebView on iOS;
  // rel=0 stops "related videos" panel from suggesting outside the segment.
  const embedUrl =
    `https://www.youtube.com/embed/${video.id}` +
    `?autoplay=1&playsinline=1&rel=0&modestbranding=1`;

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: embedUrl }}
        style={styles.web}
        allowsFullscreenVideo
        javaScriptEnabled
        domStorageEnabled
        mediaPlaybackRequiresUserAction={false}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.accent} size="large" />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  web: { flex: 1, backgroundColor: colors.background },
  loading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
