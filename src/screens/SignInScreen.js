import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, ActivityIndicator, Alert,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { GOOGLE_WEB_CLIENT_ID, YOUTUBE_SCOPES } from '../config';
import { saveToken } from '../utils/storage';
import { colors, spacing } from '../theme';

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen({ navigation }) {
  const [busy, setBusy] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    scopes: YOUTUBE_SCOPES,
  });

  useEffect(() => {
    if (!response) return;
    if (response.type === 'success') {
      const auth = response.authentication;
      if (auth?.accessToken) {
        saveToken({
          accessToken: auth.accessToken,
          expiresIn: auth.expiresIn,
        }).then(() => {
          navigation.replace('Home');
        });
      } else {
        setBusy(false);
        Alert.alert('Sign-in failed', 'No access token returned.');
      }
    } else if (response.type === 'error') {
      setBusy(false);
      Alert.alert('Sign-in failed', response.error?.message || 'Unknown error');
    } else if (response.type === 'cancel' || response.type === 'dismiss') {
      setBusy(false);
    }
  }, [response]);

  const onPress = async () => {
    setBusy(true);
    await promptAsync();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>focusview</Text>
        <Text style={styles.tagline}>
          YouTube, sliced into segments you actually care about. No Shorts. No noise.
        </Text>

        <TouchableOpacity
          style={[styles.button, (!request || busy) && styles.buttonDisabled]}
          onPress={onPress}
          disabled={!request || busy}
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
});
