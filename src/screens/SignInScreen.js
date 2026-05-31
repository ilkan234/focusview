import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, ActivityIndicator, Alert, Modal,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { GOOGLE_WEB_CLIENT_ID, YOUTUBE_SCOPES, OAUTH_HTTPS_REDIRECT } from '../config';
import { saveToken, setHasSignedIn, getHasSignedIn } from '../utils/storage';
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
      if (window.location.href.indexOf('access_token') > -1 ||
          window.location.href.indexOf('error=') > -1) {
        window.ReactNativeWebView.postMessage(window.location.href);
      }
    } catch (e) {}
  })();
  true;
`;

// How long to wait for a silent re-login before falling back to the button.
const SILENT_TIMEOUT_MS = 12000;

// silent=true asks Google to return a token without any UI (prompt=none).
const buildAuthUrl = (state, silent) => {
  const params = {
    client_id: GOOGLE_WEB_CLIENT_ID,
    redirect_uri: OAUTH_HTTPS_REDIRECT,
    response_type: 'token',
    scope: YOUTUBE_SCOPES.join(' '),
    include_granted_scopes: 'true',
    state,
  };
  if (silent) params.prompt = 'none';
  const qs = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  return `https://accounts.google.com/o/oauth2/v2/auth?${qs}`;
};

const parseFragment = (url) => {
  const hash = url.split('#')[1] || (url.includes('?') ? url.split('?')[1] : '');
  if (!hash) return null;
  const out = {};
  for (const pair of hash.split('&')) {
    const [k, v = ''] = pair.split('=');
    out[decodeURIComponent(k)] = decodeURIComponent(v);
  }
  return out;
};

export default function SignInScreen({ navigation }) {
  // 'checking' = deciding whether to try silent login, 'silent' = hidden
  // re-login in progress, 'idle' = show button, 'interactive' = visible WebView.
  const [mode, setMode] = useState('checking');
  const [authUrl, setAuthUrl] = useState(null);
  const csrfRef = useRef(null);
  const doneRef = useRef(false);
  const modeRef = useRef('checking');
  const timerRef = useRef(null);

  const setModeBoth = (m) => { modeRef.current = m; setMode(m); };

  const clearTimer = () => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  };

  const begin = (silent) => {
    const csrf = Math.random().toString(36).slice(2);
    csrfRef.current = csrf;
    doneRef.current = false;
    setAuthUrl(buildAuthUrl(csrf, silent));
    setModeBoth(silent ? 'silent' : 'interactive');
    clearTimer();
    if (silent) {
      timerRef.current = setTimeout(() => {
        if (doneRef.current) return;
        // Silent login took too long or stalled — show the button instead.
        setAuthUrl(null);
        setModeBoth('idle');
      }, SILENT_TIMEOUT_MS);
    }
  };

  // On launch, try a silent re-login if the user has signed in before.
  useEffect(() => {
    getHasSignedIn().then((seen) => {
      if (seen) begin(true);
      else setModeBoth('idle');
    });
    return clearTimer;
  }, []);

  const closeAuth = () => { clearTimer(); setAuthUrl(null); };

  // Returns true if the URL carried our token/error and was consumed.
  const handleUrl = async (url) => {
    if (doneRef.current) return true;
    if (!url || url.indexOf(OAUTH_HTTPS_REDIRECT) !== 0) return false;

    const params = parseFragment(url);
    if (!params || (!params.access_token && !params.error)) return false;

    doneRef.current = true;
    clearTimer();
    const wasSilent = modeRef.current === 'silent';
    setAuthUrl(null);

    if (params.error || !params.access_token) {
      // A silent attempt that needs user interaction just falls back to the
      // button — no scary alert, that is the expected "session expired" path.
      if (wasSilent) { setModeBoth('idle'); return true; }
      Alert.alert('Sign-in failed', params.error_description || params.error || 'No access token.');
      setModeBoth('idle');
      return true;
    }
    if (params.state !== csrfRef.current) {
      if (wasSilent) { setModeBoth('idle'); return true; }
      Alert.alert('Sign-in failed', 'Security check failed (state mismatch). Please try again.');
      setModeBoth('idle');
      return true;
    }

    await saveToken({
      accessToken: params.access_token,
      expiresIn: parseInt(params.expires_in || '3600', 10),
    });
    await setHasSignedIn();
    navigation.replace('Home');
    return true;
  };

  // Block any navigation that leaves the web (e.g. a stray exp:// redirect that
  // used to pop the "open with mail app" chooser).
  const onShouldStart = (req) => {
    const url = req.url || '';
    if (url.indexOf(OAUTH_HTTPS_REDIRECT) === 0) { handleUrl(url); return true; }
    if (!/^https?:/i.test(url)) return false;
    return true;
  };

  const webViewProps = {
    userAgent: BROWSER_UA,
    injectedJavaScript: TOKEN_PROBE,
    onShouldStartLoadWithRequest: onShouldStart,
    onNavigationStateChange: (s) => handleUrl(s.url),
    onMessage: (e) => handleUrl(e.nativeEvent.data),
  };

  // Full-screen blocking spinner while we check / silently re-login. The silent
  // WebView is mounted underneath so it can run, but stays hidden behind this.
  if (mode === 'checking' || mode === 'silent') {
    return (
      <SafeAreaView style={styles.container}>
        {mode === 'silent' && authUrl ? (
          <WebView source={{ uri: authUrl }} {...webViewProps} style={styles.hiddenWeb} />
        ) : null}
        <View style={styles.center}>
          <Text style={styles.logo}>focusview</Text>
          <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.lg }} />
          <Text style={styles.tagline}>Signing you in…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>focusview</Text>
        <Text style={styles.tagline}>
          YouTube, sliced into segments you actually care about. No Shorts. No noise.
        </Text>

        <TouchableOpacity style={styles.button} onPress={() => begin(false)}>
          <Text style={styles.buttonText}>Sign in with Google</Text>
        </TouchableOpacity>

        <Text style={styles.fineprint}>
          We read your subscriptions and channel uploads. We never post or modify anything.
        </Text>
      </View>

      <Modal visible={mode === 'interactive' && !!authUrl} animationType="slide" onRequestClose={closeAuth}>
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalBar}>
            <Text style={styles.modalTitle}>Sign in with Google</Text>
            <TouchableOpacity onPress={closeAuth} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          {authUrl ? (
            <WebView
              source={{ uri: authUrl }}
              {...webViewProps}
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hiddenWeb: { position: 'absolute', width: 1, height: 1, opacity: 0 },
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
