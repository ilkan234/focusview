import {
  SHORT_MAX_SECONDS,
  MAX_CHANNELS_SCANNED,
  VIDEOS_PER_CHANNEL,
} from '../config';

const API = 'https://www.googleapis.com/youtube/v3';

class AuthError extends Error {
  constructor(msg) { super(msg); this.name = 'AuthError'; }
}

const request = async (token, path, params = {}) => {
  const url = new URL(API + path);
  Object.entries(params).forEach(([k, v]) => {
    if (v != null) url.searchParams.set(k, String(v));
  });
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  if (res.status === 401 || res.status === 403) {
    throw new AuthError(`YouTube API auth failed (${res.status})`);
  }
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`YouTube API ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
};

// Convert "PT1H2M30S" -> 3750 seconds
export const parseDuration = (iso) => {
  if (!iso) return 0;
  const m = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!m) return 0;
  const [, h, mi, s] = m;
  return (parseInt(h || 0) * 3600) + (parseInt(mi || 0) * 60) + parseInt(s || 0);
};

export const isShort = (durationSeconds) => durationSeconds <= SHORT_MAX_SECONDS;

export const matchesKeywords = (video, keywords) => {
  if (!keywords || keywords.length === 0) return true;
  const haystack = `${video.title} ${video.description}`.toLowerCase();
  return keywords.some((kw) => haystack.includes(kw.toLowerCase()));
};

export const fetchAllSubscriptions = async (token) => {
  const channels = [];
  let pageToken;
  do {
    const data = await request(token, '/subscriptions', {
      part: 'snippet',
      mine: true,
      maxResults: 50,
      pageToken,
    });
    for (const item of data.items || []) {
      channels.push({
        channelId: item.snippet.resourceId.channelId,
        title: item.snippet.title,
      });
    }
    pageToken = data.nextPageToken;
  } while (pageToken && channels.length < MAX_CHANNELS_SCANNED * 2);
  return channels.slice(0, MAX_CHANNELS_SCANNED);
};

export const fetchUploadsPlaylistIds = async (token, channelIds) => {
  const result = {};
  for (let i = 0; i < channelIds.length; i += 50) {
    const batch = channelIds.slice(i, i + 50);
    const data = await request(token, '/channels', {
      part: 'contentDetails',
      id: batch.join(','),
    });
    for (const item of data.items || []) {
      const uploads = item.contentDetails?.relatedPlaylists?.uploads;
      if (uploads) result[item.id] = uploads;
    }
  }
  return result;
};

export const fetchPlaylistVideoIds = async (token, playlistId, maxResults = VIDEOS_PER_CHANNEL) => {
  const data = await request(token, '/playlistItems', {
    part: 'contentDetails',
    playlistId,
    maxResults,
  });
  return (data.items || []).map((item) => item.contentDetails.videoId);
};

export const fetchVideoDetails = async (token, videoIds) => {
  const result = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const data = await request(token, '/videos', {
      part: 'contentDetails,snippet',
      id: batch.join(','),
    });
    for (const item of data.items || []) {
      const durationSeconds = parseDuration(item.contentDetails.duration);
      result.push({
        id: item.id,
        title: item.snippet.title,
        description: item.snippet.description || '',
        channelTitle: item.snippet.channelTitle,
        channelId: item.snippet.channelId,
        publishedAt: item.snippet.publishedAt,
        thumbnail:
          item.snippet.thumbnails?.high?.url ||
          item.snippet.thumbnails?.medium?.url ||
          item.snippet.thumbnails?.default?.url,
        durationSeconds,
      });
    }
  }
  return result;
};

export const fetchSegmentVideos = async (token, keywords) => {
  const subs = await fetchAllSubscriptions(token);
  if (subs.length === 0) return [];

  const uploadsMap = await fetchUploadsPlaylistIds(
    token,
    subs.map((s) => s.channelId),
  );

  const playlistIds = Object.values(uploadsMap);
  const videoIdLists = await Promise.all(
    playlistIds.map((pid) =>
      fetchPlaylistVideoIds(token, pid).catch(() => []),
    ),
  );
  const videoIds = [...new Set(videoIdLists.flat())];
  if (videoIds.length === 0) return [];

  const videos = await fetchVideoDetails(token, videoIds);

  return videos
    .filter((v) => !isShort(v.durationSeconds))
    .filter((v) => matchesKeywords(v, keywords))
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
};

export { AuthError };
