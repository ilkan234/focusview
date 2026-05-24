import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, ActivityIndicator, Alert,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { GOOGLE_WEB_CLIENT_ID, YOUTUBE_SCOPES, OAUTH_HTTPS_REDIRECT } from '../config';
import { saveToken } from '../utils/storage';
import { colors, spacing } from '../theme';

WebBrowser.maybeCompleteAuthSession();

// State carries two things: a CSRF token, and the runtime deep-link
// URL the GitHub Pages redirect page should bounce back to. Split with
// "::" because both halves are URL-safe but the LAN URL in dev contains
// colons and slashes.
const packState = (csrf, returnUrl) => `${csrf}::${returnUrl}`;

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
  const [busy, setBusy] = useState(false);
  const [debug, setDebug] = useState('');
  const pendingRef = useRef(null);

  const log = (line) => {
    setDebug((prev) => {
      const next = `${new Date().toISOString().slice(11, 19)} ${line}\n${prev}`;
      return next.slice(0, 2000);
    });
    console.log('[signin]', line);
  };

  const completeSignIn = async (url, source) => {
    log(`completeSignIn via ${source}: ${url.slice(0, 120)}`);
    const pending = pendingRef.current;
    if (!pending) {
      log('  no pending — ignored');
      return false;
    }
    pendingRef.current = null;

    const params = parseFragment(url);
    if (!params) {
      log('  no fragment in URL');
      Alert.alert('Sign-in failed', `No fragment in redirect URL:\n${url}`);
      return true;
    }
    log(`  parsed keys: ${Object.keys(params).join(',')}`);
    if (params.error) {
      Alert.alert('Sign-in failed', params.error_description || params.error);
      return true;
    }
    if (params.state !== pending.csrf) {
      Alert.alert('Sign-in failed', `State mismatch\nexpected: ${pending.csrf}\ngot: ${params.state}`);
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
    log('  token saved — navigating Home');
    navigation.replace('Home');
    return true;
  };

  useEffect(() => {
    const sub = Linking.addEventListener('url', ({ url }) => {
      log(`Linking url event: ${url ? url.slice(0, 120) : '(empty)'}`);
      if (!url) return;
      if (!pendingRef.current) return;
      if (!url.includes('oauthredirect')) return;
      completeSignIn(url, 'Linking');
    });
    Linking.getInitialURL().then((url) => {
      if (url) log(`Initial URL: ${url.slice(0, 120)}`);
    });
    return () => sub.remove();
  }, []);

  const startSignIn = async () => {
    setBusy(true);
    setDebug('');
    try {
      const csrf = Math.random().toString(36).slice(2);
      const returnUrl = Linking.createURL('oauthredirect');
      pendingRef.current = { csrf };
      log(`returnUrl=${returnUrl}`);
      log(`csrf=${csrf}`);
      const state = packState(csrf, returnUrl);
      const authUrl = buildAuthUrl(state);

      const result = await WebBrowser.openAuthSessionAsync(authUrl, returnUrl);
      log(`openAuthSession result.type=${result.type} url=${result.url ? result.url.slice(0, 120) : '(none)'}`);

      if (result.type === 'success' && result.url) {
        await completeSignIn(result.url, 'WebBrowser');
      }
    } catch (e) {
      pendingRef.current = null;
      log(`exception: ${e?.message || e}`);
      Alert.alert('Sign-in failed', e?.message || 'Unknown error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>focusview</Text>
        <Text style={styles.tagline}>
          YouTube, sliced into segments you actually care about. No Shorts. No noise.
        </Text>

        <TouchableOpacity
          style={[styles.button, busy && styles.buttonDisabled]}
          onPress={startSignIn}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign in with Google</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.fineprint}>
          We read your subscriptions and channel uploads. We never post or modify anything.
        </Text>

        {debug ? (
          <View style={styles.debugBox}>
            <Text style={styles.debugTitle}>debug</Text>
            <Text style={styles.debugText} selectable>{debug}</Text>
          </View>
        ) : null}
      </View>
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
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  fineprint: {
    color: colors.textMuted, fontSize: 12, textAlign: 'center',
    marginTop: spacing.lg, lineHeight: 18,
  },
  debugBox: {
    marginTop: spacing.lg, padding: spacing.md, borderRadius: 8,
    backgroundColor: '#1A1A1A', maxHeight: 240, alignSelf: 'stretch',
  },
  debugTitle: {
    color: colors.accent, fontSize: 11, fontWeight: '700',
    marginBottom: 4, letterSpacing: 1,
  },
  debugText: {
    color: '#9AA', fontSize: 11, fontFamily: 'monospace', lineHeight: 15,
  },
});
