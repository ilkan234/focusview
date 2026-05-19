// Template — copy to `src/config.js` and fill in real values.
// `src/config.js` is gitignored so secrets stay local.
//
// Expo Go (development) uses the Web Client ID via Google's auth proxy.
// For a standalone Android build you'll also need an Android Client ID
// (see docs/SETUP_OAUTH.md § 5).
export const GOOGLE_WEB_CLIENT_ID = 'REPLACE_WITH_WEB_CLIENT_ID.apps.googleusercontent.com';

// Must match exactly one of the Authorized redirect URIs on the Web OAuth
// client in GCP. The URL is just a string Google redirects to — we
// intercept it inside our WebView; the page on the other end is never loaded.
// Default is the legacy Expo auth proxy URL with your Expo username slotted in.
export const OAUTH_REDIRECT_URI = 'https://auth.expo.io/@YOUR_EXPO_USERNAME/focusview';

export const YOUTUBE_SCOPES = ['https://www.googleapis.com/auth/youtube.readonly'];

// Anything shorter than this is treated as a Short and dropped.
// YouTube's current Shorts limit is 3 min; 60s is the classic definition.
export const SHORT_MAX_SECONDS = 60;

// MVP guard rails to stay under the YouTube Data API quota (10k units/day).
export const MAX_CHANNELS_SCANNED = 100;
export const VIDEOS_PER_CHANNEL = 10;
