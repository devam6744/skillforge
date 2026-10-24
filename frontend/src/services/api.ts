import type { User, AuthResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const csrfToken = getCookie('csrftoken');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (csrfToken && options.method && options.method.toUpperCase() !== 'GET') {
    headers['X-CSRFToken'] = csrfToken;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Includes Django sessionid cookie
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error?.message || data.detail || 'An unexpected error occurred.';
    const error = new Error(errorMsg) as Error & { details?: any; code?: string };
    error.details = data.error?.details || data;
    error.code = data.error?.code || 'API_ERROR';
    throw error;
  }

  return data as T;
}

export const api = {
  auth: {
    initCsrf: () => request<{ message: string }>('/auth/csrf/'),
    register: (email: string, password: string, password_confirm: string, display_name?: string) =>
      request<AuthResponse>('/auth/register/', {
        method: 'POST',
        body: JSON.stringify({ email, password, password_confirm, display_name }),
      }),
    login: (email: string, password: string) =>
      request<AuthResponse>('/auth/login/', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    google: (credentialOrEmail: string) =>
      request<AuthResponse>('/auth/google/', {
        method: 'POST',
        body: JSON.stringify({
          credential: credentialOrEmail,
          email: credentialOrEmail.includes('@') ? credentialOrEmail : undefined,
        }),
      }),
    logout: () =>
      request<{ message: string }>('/auth/logout/', {
        method: 'POST',
      }),
    me: () => request<{ user: User }>('/auth/me/'),
  },
  profile: {
    get: () => request<any>('/profile/'),
    update: (data: Partial<{
      display_name: string;
      username: string;
      bio: string;
      initial_skill_level: string;
      onboarding_completed: boolean;
    }>) =>
      request<any>('/profile/', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },
};
