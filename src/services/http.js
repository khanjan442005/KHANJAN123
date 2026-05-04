const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const SESSION_TOKEN_KEY = 'medicore-api-session-v1';

function parseJsonSafely(value) {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function createHttpError(status, data, fallbackMessage) {
  const error = new Error(data?.message || fallbackMessage || 'Request failed.');
  error.response = {
    status,
    data: data || null
  };
  return error;
}

export function getSessionToken() {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.localStorage.getItem(SESSION_TOKEN_KEY) || '';
}

export function setSessionToken(token) {
  if (typeof window === 'undefined') {
    return;
  }

  if (token) {
    window.localStorage.setItem(SESSION_TOKEN_KEY, token);
    return;
  }

  window.localStorage.removeItem(SESSION_TOKEN_KEY);
}

export function clearSessionToken() {
  setSessionToken('');
}

export function toQueryString(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    searchParams.set(key, String(value));
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

export async function request(path, options = {}) {
  const {
    method = 'GET',
    body,
    auth = true,
    headers: customHeaders
  } = options;

  const headers = new Headers(customHeaders || {});
  const sessionToken = getSessionToken();

  if (auth && sessionToken) {
    headers.set('Authorization', `Bearer ${sessionToken}`);
  }

  let payloadBody = body;

  if (body !== undefined && !(body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
    payloadBody = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: payloadBody
  });

  const rawText = await response.text();
  const data = parseJsonSafely(rawText) ?? (rawText ? { message: rawText } : null);

  if (!response.ok) {
    if (response.status === 401) {
      clearSessionToken();
    }

    throw createHttpError(response.status, data, `HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return data;
}

export function getErrorMessage(error) {
  const responseData = error?.response?.data;

  if (typeof responseData === 'string' && responseData.trim().length > 0) {
    return responseData;
  }

  if (responseData?.message) {
    return responseData.message;
  }

  if (responseData?.errors) {
    const firstError = Object.values(responseData.errors).flat().find(Boolean);
    if (firstError) {
      return firstError;
    }
  }

  if (responseData?.title) {
    return responseData.title;
  }

  return error?.message || 'Request failed.';
}
