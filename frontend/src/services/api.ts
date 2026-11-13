import type { User, AuthResponse } from '../types';

function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    // In production (e.g. Vercel, cloud domains), always route same-origin to /api/v1
    if (!isLocal) {
      return '/api/v1';
    }
  }
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
}

const API_BASE_URL = getApiBaseUrl();

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
    requestPasswordResetOtp: (email: string) =>
      request<{ message: string; email: string; expires_in_minutes: number }>('/auth/password-reset/request-otp/', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),
    verifyPasswordResetOtp: (email: string, otp: string) =>
      request<{ valid: boolean; message: string }>('/auth/password-reset/verify-otp/', {
        method: 'POST',
        body: JSON.stringify({ email, otp }),
      }),
    confirmPasswordReset: (email: string, otp: string, new_password: string, new_password_confirm: string) =>
      request<{ message: string; user: User }>('/auth/password-reset/confirm/', {
        method: 'POST',
        body: JSON.stringify({ email, otp, new_password, new_password_confirm }),
      }),
    changePassword: (current_password: string, new_password: string, new_password_confirm: string) =>
      request<{ message: string }>('/auth/password/change/', {
        method: 'POST',
        body: JSON.stringify({ current_password, new_password, new_password_confirm }),
      }),
    getMultiDeviceSessions: () =>
      request<{ current_device: any; other_active_devices_count: number; total_active_devices: number }>('/auth/sessions/multi-device/'),
    logoutOtherDevices: () =>
      request<{ message: string; revoked_count: number }>('/auth/sessions/multi-device/', {
        method: 'POST',
      }),
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
  catalog: {
    getLanguages: () => request<import('../types').ProgrammingLanguage[]>('/catalog/languages/'),
    getTopics: (languageSlug: string) =>
      request<import('../types').Topic[]>(`/catalog/languages/${languageSlug}/topics/`),
  },
  practice: {
    getActiveSession: () =>
      request<{ active_session: import('../types').PracticeSession | null }>('/practice/sessions/active/'),
    listSessions: () =>
      request<{ count: number; results: import('../types').PracticeSession[] } | import('../types').PracticeSession[]>('/practice/sessions/'),
    createSession: (payload: {
      language_slug: string;
      topic_slug?: string | null;
      practice_type: 'TOPIC' | 'MIXED';
      difficulty_mode: 'EASY' | 'MEDIUM' | 'HARD' | 'ADAPTIVE';
      practice_mode: 'CODING' | 'DEBUG';
      requested_question_count: number;
    }) =>
      request<import('../types').PracticeSession>('/practice/sessions/', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    getSession: (id: string) =>
      request<import('../types').PracticeSession>(`/practice/sessions/${id}/`),
    abandonSession: (id: string) =>
      request<import('../types').PracticeSession>(`/practice/sessions/${id}/abandon/`, {
        method: 'POST',
      }),
    completeSession: (id: string) =>
      request<import('../types').PracticeSession>(`/practice/sessions/${id}/complete/`, {
        method: 'POST',
      }),
    getCurrentChallenge: (sessionId: string) =>
      request<import('../types').SessionChallengeData>(`/practice/sessions/${sessionId}/current-challenge/`),
    getNextChallenge: (sessionId: string) =>
      request<import('../types').SessionChallengeData>(`/practice/sessions/${sessionId}/next-challenge/`, {
        method: 'POST',
      }),
    skipChallenge: (sessionId: string) =>
      request<import('../types').SessionChallengeData>(`/practice/sessions/${sessionId}/skip-challenge/`, {
        method: 'POST',
      }),
    submitCode: (sessionId: string, challengeId: string, sourceCode: string) =>
      request<{
        submission_id: string;
        score: number;
        status: string;
        is_solved: boolean;
        is_session_finished: boolean;
        summary: string;
        feedback: string;
        syntax_issues: string[];
        logic_issues: string[];
        concepts_demonstrated: string[];
        complexity: string;
        timestamp: string;
      }>(`/practice/sessions/${sessionId}/submit/`, {
        method: 'POST',
        body: JSON.stringify({ challenge_id: challengeId, source_code: sourceCode }),
      }),
    getAnalytics: (track?: string, window?: string) => {
      const params = new URLSearchParams();
      if (track) params.append('track', track);
      if (window) params.append('window', window);
      const query = params.toString() ? `?${params.toString()}` : '';
      return request<{
        kpis: {
          global_rubric_score: number;
          trend_percentage: string;
          confidence_rating: string;
          total_scenarios_solved: number;
          batches_count: number;
          optimal_count: number;
          sound_count: number;
          review_count: number;
          logic_accuracy_percentage: number;
          streak_days: number;
          peak_streak_days: number;
        };
        selected_window?: string;
        calibration_matrix: Array<{
          topic_id: string;
          topic_slug: string;
          name: string;
          score: number;
          confidence: number;
          status: string;
          solved_count: number;
          tags: string[];
          last_practiced: string;
          is_primary_vector: boolean;
        }>;
        trajectory_series: Array<{
          step: number;
          scenario: string;
          score: number;
          bayesian_avg: number;
          topic: string;
          date: string;
        }>;
        rubric_dimensions: Array<{
          dimension: string;
          score: number;
          benchmark: number;
          description: string;
        }>;
        diagnostic_insight: {
          title: string;
          analysis: string;
          radar_metrics: {
            invariant_soundness: number;
            memory_hygiene: number;
            boundary_corner_trapping: number;
          };
          target_topic_name: string;
          target_topic_slug: string;
          remediation_cta: string;
        };
        activity_heatmap: Array<{
          date: string;
          display_date: string;
          day_of_week: number;
          count: number;
          level: number;
          avg_score: number;
          topics: string[];
        }>;
        heatmap_meta: {
          total_submissions: number;
          active_days: number;
          current_streak: number;
          peak_streak: number;
          completion_rate: number;
          weeks_count: number;
          start_date: string;
          end_date: string;
        };
        evidence_log: Array<{
          timestamp: string;
          scenario_name: string;
          track_topic: string;
          score: string;
          complexity: string;
          proofs: string[];
          summary: string;
          is_solved: boolean;
        }>;
      }>(`/practice/analytics/${query}`);
    },
  },
  challenges: {
    getChallenge: (id: string) =>
      request<import('../types').ChallengeDetail>(`/challenges/${id}/`),
    submitCode: (challengeId?: string, sourceCode: string = '', languageSlug?: string) =>
      request<{
        submission_id: string;
        challenge_id: string;
        challenge_title: string;
        score: number;
        status: string;
        is_solved: boolean;
        summary: string;
        feedback: string;
        syntax_issues: string[];
        logic_issues: string[];
        concepts_demonstrated: string[];
        complexity: string;
        timestamp: string;
      }>('/challenges/submit/', {
        method: 'POST',
        body: JSON.stringify({ challenge_id: challengeId, source_code: sourceCode, language_slug: languageSlug }),
      }),
  },
};
