import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, ActivityIndicator, Alert, Modal,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { GOOGLE_WEB_CLIENT_ID, YOUTUBE_SCOPES, OAUTH_REDIRECT_URI } from '../config';
import { saveToken } from '../utils/storage';
import { colors, spacing } from '../theme';

const buildAuthUrl = (state) => {
  const params = {
    client_id: GOOGLE_WEB_CLIENT_ID,
    redirect_uri: OAUTH_REDIRECT_URI,
    response_type: 'token',
    scope: YOUTUBE_SCOPES.join(' '),
    include_granted_scopes: 'true',
    prompt: 'consent',
    state,
  };
  const qs = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  return `https://accounts.google.com/o/oauth2/v2/auth?${qs}`;
};

const parseFragment = (url) => {
  const hash = url.split('#')[1];
  if (!hash) return null;
  const out = {};
  for (const pair of hash.split('&')) {
    const [k, v = ''] = pair.split('=');
    out[decodeURIComponent(k)] = decodeURIComponent(v);
  }
  return out;
};

export default function SignInScreen({ navigation }) {
  const [authUrl, setAuthUrl] = useState(null);
  const handledRef = useRef(false);
  const stateRef = useRef(null);

  const startSignIn = () => {
    const state = Math.random().toString(36).slice(2);
    stateRef.current = state;
    handledRef.current = false;
    setAuthUrl(buildAuthUrl(state));
  };

  const finishWithError = (msg) => {
    setAuthUrl(null);
    Alert.alert('Sign-in failed', msg);
  };

  // Returns true if we handled (i.e. caller should NOT load the URL).
  const handleRedirect = (url) => {
    if (!url || !url.startsWith(OAUTH_REDIRECT_URI) || handledRef.current) return false;
    handledRef.current = true;
    setAuthUrl(null);

    const params = parseFragment(url);
    if (!params) {
      Alert.alert('Sign-in failed', 'Google returned no data.');
      return true;
    }
    if (params.error) {
      Alert.alert('Sign-in failed', params.error_description || params.error);
      return true;
    }
    if (params.state !== stateRef.current) {
      Alert.alert('Sign-in failed', 'State mismatch — possible CSRF, try again.');
      return true;
    }
    if (!params.access_token) {
      Alert.alert('Sign-in failed', 'No access token in redirect.');
      return true;
    }

    saveToken({
      accessToken: params.access_token,
      expiresIn: parseInt(params.expires_in || '3600', 10),
    }).then(() => navigation.replace('Home'));
    return true;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>focusview</Text>
        <Text style={styles.tagline}>
          YouTube, sliced into segments you actually care about. No Shorts. No noise.
        </Text>

        <TouchableOpacity style={styles.button} onPress={startSignIn}>
          <Text style={styles.buttonText}>Sign in with Google</Text>
        </TouchableOpacity>

        <Text style={styles.fineprint}>
          We read your subscriptions and channel uploads. We never post or modify anything.
        </Text>
      </View>

      <Modal
        visible={!!authUrl}
        animationType="slide"
        onRequestClose={() => setAuthUrl(null)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setAuthUrl(null)} style={styles.modalCancel}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Sign in with Google</Text>
            <View style={styles.modalCancel} />
          </View>
          {authUrl && (
            <WebView
              source={{ uri: authUrl }}
              incognito
              javaScriptEnabled
              domStorageEnabled
              startInLoadingState
              onShouldStartLoadWithRequest={(req) => !handleRedirect(req.url)}
              onNavigationStateChange={(navState) => handleRedirect(navState.url)}
              onError={(e) =>
                finishWithError(e.nativeEvent?.description || 'WebView failed to load.')
              }
              renderLoading={() => (
                <View style={styles.loading}>
                  <ActivityIndicator color={colors.accent} size="large" />
                </View>
              )}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  logo: {
    color: colors.text, fontSize: 42, fontWeight: '800',
    letterSpacing: 2, marginBottom: spacing.md,
  },
  tagline: {
    color: colors.textSecondary, fontSize: 16, textAlign: 'center',
    lineHeight: 24, marginBottom: spacing.xl,
  },
  button: {
    backgroundColor: colors.accent, borderRadius: 30,
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
    minWidth: 240, alignItems: 'center', marginBottom: spacing.lg,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  fineprint: {
    color: colors.textMuted, fontSize: 12, textAlign: 'center',
    marginTop: spacing.lg, lineHeight: 18,
  },
  modalContainer: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  modalCancel: { minWidth: 60 },
  modalCancelText: { color: colors.accent, fontSize: 15, fontWeight: '600' },
  modalTitle: { color: colors.text, fontSize: 16, fontWeight: '600' },
  loading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: colors.background,
  },
});
