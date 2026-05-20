// Template — copy to `src/config.js` and fill in real values.
// `src/config.js` is gitignored so secrets stay local.
//
// Expo Go (development) uses the Web Client ID via Google's auth proxy.
// For a standalone Android build you'll also need an Android Client ID
// (see docs/SETUP_OAUTH.md § 5).
export const GOOGLE_WEB_CLIENT_ID = 'REPLACE_WITH_WEB_CLIENT_ID.apps.googleusercontent.com';

// HTTPS landing page (hosted by GitHub Pages from /docs) that Google
// redirects to after the user consents. The page reads the URL fragment
// and deep-links back into the app. Must match exactly an Authorized
// redirect URI on the Web OAuth client in GCP.
//
// Update YOUR_GH_USER / YOUR_REPO to match your fork (default values
// assume the repo is at github.com/YOUR_GH_USER/focusview with Pages
// serving from /docs).
export const OAUTH_HTTPS_REDIRECT =
  'https://YOUR_GH_USER.github.io/focusview/oauth.html';

export const YOUTUBE_SCOPES = ['https://www.googleapis.com/auth/youtube.readonly'];

// Anything shorter than this is treated as a Short and dropped.
// YouTube's current Shorts limit is 3 min; 60s is the classic definition.
export const SHORT_MAX_SECONDS = 60;

// MVP guard rails to stay under the YouTube Data API quota (10k units/day).
export const MAX_CHANNELS_SCANNED = 100;
export const VIDEOS_PER_CHANNEL = 10;
