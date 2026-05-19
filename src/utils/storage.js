import AsyncStorage from '@react-native-async-storage/async-storage';

const SEGMENTS_KEY = 'focusview_segments';
const TOKEN_KEY = 'focusview_token';

export const getSegments = async () => {
  try {
    const data = await AsyncStorage.getItem(SEGMENTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
};

export const saveSegments = async (segments) => {
  await AsyncStorage.setItem(SEGMENTS_KEY, JSON.stringify(segments));
};

export const addSegment = async (segment) => {
  const segments = await getSegments();
  const updated = [...segments, { ...segment, id: Date.now().toString() }];
  await saveSegments(updated);
  return updated;
};

export const deleteSegment = async (id) => {
  const segments = await getSegments();
  const updated = segments.filter(s => s.id !== id);
  await saveSegments(updated);
  return updated;
};

export const saveToken = async ({ accessToken, expiresIn }) => {
  const record = {
    accessToken,
    expiresAt: expiresIn ? Date.now() + expiresIn * 1000 : null,
  };
  await AsyncStorage.setItem(TOKEN_KEY, JSON.stringify(record));
  return record;
};

export const getToken = async () => {
  try {
    const data = await AsyncStorage.getItem(TOKEN_KEY);
    if (!data) return null;
    const record = JSON.parse(data);
    if (record.expiresAt && Date.now() >= record.expiresAt) return null;
    return record;
  } catch { return null; }
};

export const clearToken = async () => {
  await AsyncStorage.removeItem(TOKEN_KEY);
};