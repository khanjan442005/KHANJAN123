import { clearSessionToken, getSessionToken, request, setSessionToken } from './http';

export async function login(payload) {
  const response = await request('/auth/login', {
    method: 'POST',
    body: payload,
    auth: false
  });

  setSessionToken(response?.sessionToken || '');
  return response;
}

export async function getMe() {
  if (!getSessionToken()) {
    return { isAuthenticated: false };
  }

  return request('/auth/me');
}

export async function logout() {
  try {
    if (getSessionToken()) {
      await request('/auth/logout', {
        method: 'POST'
      });
    }
  } finally {
    clearSessionToken();
  }
}

export function forgotPassword(payload) {
  return request('/auth/forgot-password', {
    method: 'POST',
    body: payload,
    auth: false
  });
}

export function resetPassword(payload) {
  return request('/auth/reset-password', {
    method: 'POST',
    body: payload,
    auth: false
  });
}

export function registerPatient(payload) {
  return request('/auth/register/patient', {
    method: 'POST',
    body: payload,
    auth: false
  });
}

export function registerDoctor(payload) {
  return request('/auth/register/doctor', {
    method: 'POST',
    body: payload,
    auth: false
  });
}

export function registerAdmin(payload) {
  return request('/auth/register/admin', {
    method: 'POST',
    body: payload,
    auth: false
  });
}
