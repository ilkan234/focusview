import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, ActivityIndicator, Alert, Modal,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { GOOGLE_WEB_CLIENT_ID, YOUTUBE_SCOPES, OAUTH_HTTPS_REDIRECT } from '../config';
import { saveToken } from '../utils/storage';
import { colors, spacing } from '../theme';

// Google blocks OAuth in embedded WebViews ("disallowed_useragent") when the
// UA contains the "; wv" token that react-native-webview adds by default.
// A plain Chrome UA (no "wv") looks like a normal browser and is allowed.
const BROWSER_UA =
  'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';

// Injected on every page so we can read the token from the URL fragment
// (the # part is visible to JS even when native navigation events strip it).
const TOKEN_PROBE = `
  (function () {
    try {
      if (window.location.href.indexOf('access_token') > -1) {
        window.ReactNativeWebView.postMessage(window.location.href);
      }
    } catch (e) {}
  })();
  true;
`;

const buildAuthUrl = (state) => {
  const params = {
    client_id: GOOGLE_WEB_CLIENT_ID,
    redirect_uri: OAUTH_HTTPS_REDIRECT,
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
  const csrfRef = useRef(null);
  const doneRef = useRef(false);

  const startSignIn = () => {
    const csrf = Math.random().toString(36).slice(2);
    csrfRef.current = csrf;
    doneRef.current = false;
    setAuthUrl(buildAuthUrl(csrf));
  };

  const closeWebView = () => setAuthUrl(null);

  // Returns true if the URL was the redirect carrying our token.
  const handleUrl = async (url) => {
    if (doneRef.current) return true;
    if (!url || url.indexOf(OAUTH_HTTPS_REDIRECT) !== 0) return false;

    const params = parseFragment(url);
    if (!params || (!params.access_token && !params.error)) return false;

    doneRef.current = true;
    closeWebView();

    if (params.error) {
      Alert.alert('Sign-in failed', params.error_description || params.error);
      return true;
    }
    if (params.state !== csrfRef.current) {
      Alert.alert('Sign-in failed', 'Security check failed (state mismatch). Please try again.');
      return true;
    }
    if (!params.access_token) {
      Alert.alert('Sign-in failed', 'No access token in redirect.');
      return true;
    }

    await saveToken({
      accessToken: params.access_token,
      expiresIn: parseInt(params.expires_in || '3600', 10),
    });
    navigation.replace('Home');
    return true;
  };

  // Block any navigation that leaves the web (e.g. the bridge page trying to
  // open exp:// — that is what used to pop the "open with mail app" chooser).
  const onShouldStart = (req) => {
    const url = req.url || '';
    if (url.indexOf(OAUTH_HTTPS_REDIRECT) === 0) {
      handleUrl(url);
      // Let it load so the injected probe can also read the fragment, but the
      // page's own redirect to exp:// is blocked by the http(s) guard below.
      return true;
    }
    if (!/^https?:/i.test(url)) return false; // no exp://, focusview://, mailto:, etc.
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

      <Modal visible={!!authUrl} animationType="slide" onRequestClose={closeWebView}>
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalBar}>
            <Text style={styles.modalTitle}>Sign in with Google</Text>
            <TouchableOpacity onPress={closeWebView} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          {authUrl ? (
            <WebView
              source={{ uri: authUrl }}
              userAgent={BROWSER_UA}
              incognito
              injectedJavaScript={TOKEN_PROBE}
              onShouldStartLoadWithRequest={onShouldStart}
              onNavigationStateChange={(s) => handleUrl(s.url)}
              onMessage={(e) => handleUrl(e.nativeEvent.data)}
              startInLoadingState
              renderLoading={() => (
                <View style={styles.loading}>
                  <ActivityIndicator color={colors.accent} />
                </View>
              )}
            />
          ) : null}
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
  modal: { flex: 1, backgroundColor: colors.background },
  modalBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  modalTitle: { color: colors.text, fontSize: 16, fontWeight: '600' },
  modalClose: { color: colors.textSecondary, fontSize: 20, fontWeight: '700' },
  loading: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
});
