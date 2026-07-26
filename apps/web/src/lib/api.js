/**
 * API client.
 *
 * The access token is held in a module-level variable, not in localStorage.
 * A token in localStorage is readable by any script that gets onto the page;
 * a token in a closure disappears on refresh, which is exactly why the refresh
 * token lives in an httpOnly cookie the JavaScript cannot touch. That pairing
 * is what makes a cross-site scripting bug survivable rather than fatal.
 */
const BASE = import.meta.env.VITE_API_URL || '/api';

let accessToken = null;
let refreshing = null;

export const setAccessToken = (token) => {
  accessToken = token;
};
export const getAccessToken = () => accessToken;

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function raw(path, { method = 'GET', body, retry = true } = {}) {
  const response = await fetch(`${BASE}${path}`, {
    method,
    credentials: 'include',
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      'X-CWL-Client': 'web'
    },
    body: body ? JSON.stringify(body) : undefined
  });

  // A single, de-duplicated refresh attempt. Without the shared promise, a page
  // that fires four requests on mount would rotate the refresh token four times
  // and trip the reuse detector on the server.
  if (response.status === 401 && retry && !path.startsWith('/auth/')) {
    refreshing ??= raw('/auth/refresh', { method: 'POST', retry: false })
      .then((data) => {
        setAccessToken(data.accessToken);
        return data;
      })
      .catch(() => {
        setAccessToken(null);
        return null;
      })
      .finally(() => {
        refreshing = null;
      });

    const refreshed = await refreshing;
    if (refreshed) return raw(path, { method, body, retry: false });
  }

  if (response.status === 204) return null;

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
  register: (body) => raw('/auth/register', { method: 'POST', body }),
  login: (body) => raw('/auth/login', { method: 'POST', body }),
  logout: () => raw('/auth/logout', { method: 'POST' }),
  refresh: () => raw('/auth/refresh', { method: 'POST', retry: false }),
  me: () => raw('/auth/me'),
  updateProfile: (body) => raw('/auth/me', { method: 'PATCH', body }),

  catalogue: (params = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== '' && v != null)
    ).toString();
    return raw(`/catalogue${query ? `?${query}` : ''}`);
  },

  module: (moduleId) => raw(`/modules/${moduleId}`),
  completeLesson: (moduleId, miniLesson) =>
    raw(`/modules/${moduleId}/lessons/complete`, { method: 'POST', body: { miniLesson } }),

  quizOutline: (moduleId) => raw(`/quizzes/${moduleId}/outline`),
  startAttempt: (moduleId, body) => raw(`/quizzes/${moduleId}/attempts`, { method: 'POST', body }),
  submitAttempt: (attemptId, responses) =>
    raw(`/quizzes/attempts/${attemptId}/submit`, { method: 'POST', body: { responses } }),
  attempt: (attemptId) => raw(`/quizzes/attempts/${attemptId}`),
  demoQuiz: (moduleId) => raw(`/quizzes/${moduleId}/demo`, { method: 'POST' }),

  dashboard: () => raw('/progress')
};
