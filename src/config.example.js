// Template — copy to `src/config.js` and fill in real values.
// `src/config.js` is gitignored so secrets stay local.
//
// In Expo Go (development) the Web client ID is what gets used via the auth proxy.
// In a standalone Android build, the Android client ID is used.
export const GOOGLE_WEB_CLIENT_ID = 'REPLACE_WITH_WEB_CLIENT_ID.apps.googleusercontent.com';
export const GOOGLE_ANDROID_CLIENT_ID = 'REPLACE_WITH_ANDROID_CLIENT_ID.apps.googleusercontent.com';

export const YOUTUBE_SCOPES = ['https://www.googleapis.com/auth/youtube.readonly'];

// Anything shorter than this is treated as a Short and dropped.
// YouTube's current Shorts limit is 3 min; 60s is the classic definition.
export const SHORT_MAX_SECONDS = 60;

// MVP guard rails to stay under the YouTube Data API quota (10k units/day).
export const MAX_CHANNELS_SCANNED = 100;
export const VIDEOS_PER_CHANNEL = 10;
