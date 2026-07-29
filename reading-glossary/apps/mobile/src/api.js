import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

/**
 * Native API client.
 *
 * The refresh token goes into expo-secure-store, which is the iOS Keychain and
 * the Android Keystore. AsyncStorage would have been simpler and is plain text
 * on disk, readable by anything with filesystem access on a rooted device;
 * a long-lived credential does not belong there.
 *
 * The access token stays in memory only, so it never touches disk at all.
 */
const BASE = Constants.expoConfig?.extra?.apiUrl || 'https://api.codewithoutlimits.net/api';
const REFRESH_KEY = 'cwl.refresh';

let accessToken = null;
let refreshing = null;

export const setAccessToken = (token) => {
  accessToken = token;
};

export const saveRefreshToken = (token) => SecureStore.setItemAsync(REFRESH_KEY, token);
export const readRefreshToken = () => SecureStore.getItemAsync(REFRESH_KEY);
export const clearRefreshToken = () => SecureStore.deleteItemAsync(REFRESH_KEY);

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function request(path, { method = 'GET', body, retry = true } = {}) {
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      'X-CWL-Client': 'mobile'
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (response.status === 401 && retry && !path.startsWith('/auth/')) {
    refreshing ??= (async () => {
      const stored = await readRefreshToken();
      if (!stored) return null;
      try {
        const data = await request('/auth/refresh', {
          method: 'POST',
          body: { refreshToken: stored },
          retry: false
        });
        setAccessToken(data.accessToken);
        return data;
      } catch {
        await clearRefreshToken();
        setAccessToken(null);
        return null;
      } finally {
        refreshing = null;
      }
    })();

    if (await refreshing) return request(path, { method, body, retry: false });
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = payload.error || {};
    throw new ApiError(
      response.status,
      error.code || 'request_error',
      error.message || 'Something went wrong. Try again.',
      error.details
    );
  }
  return payload;
}

export const api = {
  login: (body) => request('/auth/login', { method: 'POST', body }),
  register: (body) => request('/auth/register', { method: 'POST', body }),
  logout: async () => {
    const stored = await readRefreshToken();
    await request('/auth/logout', { method: 'POST', body: { refreshToken: stored } }).catch(() => {});
    await clearRefreshToken();
    setAccessToken(null);
  },
  restoreSession: async () => {
    const stored = await readRefreshToken();
    if (!stored) return null;
    const data = await request('/auth/refresh', { method: 'POST', body: { refreshToken: stored }, retry: false });
    setAccessToken(data.accessToken);
    return data;
  },

  catalogue: () => request('/catalogue?limit=50'),
  module: (moduleId) => request(`/modules/${moduleId}`),
  completeLesson: (moduleId, miniLesson) =>
    request(`/modules/${moduleId}/lessons/complete`, { method: 'POST', body: { miniLesson } }),
  quizOutline: (moduleId) => request(`/quizzes/${moduleId}/outline`),
  startAttempt: (moduleId, body) => request(`/quizzes/${moduleId}/attempts`, { method: 'POST', body }),
  submitAttempt: (attemptId, responses) =>
    request(`/quizzes/attempts/${attemptId}/submit`, { method: 'POST', body: { responses } }),
  demoQuiz: (moduleId) => request(`/quizzes/${moduleId}/demo`, { method: 'POST' }),
  dashboard: () => request('/progress')
};

export default api;
