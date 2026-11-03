import type {
  User,
  AuthResponse,
  ProgrammingLanguage,
  Topic,
  PracticeSession,
  ChallengeDetail,
  SessionChallengeData,
} from '../types';

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
  catalog: {
    getLanguages: () => request<ProgrammingLanguage[]>('/catalog/languages/'),
    getTopics: (languageSlug: string) =>
      request<Topic[]>(`/catalog/languages/${languageSlug}/topics/`),
  },
  practice: {
    getActiveSession: () =>
      request<{ active_session: PracticeSession | null }>('/practice/sessions/active/'),
    listSessions: () =>
      request<{ count: number; results: PracticeSession[] } | PracticeSession[]>('/practice/sessions/'),
    createSession: (payload: {
      language_slug: string;
      topic_slug?: string | null;
      practice_type: 'TOPIC' | 'MIXED';
      difficulty_mode: 'EASY' | 'MEDIUM' | 'HARD' | 'ADAPTIVE';
      practice_mode: 'CODING' | 'DEBUG';
      requested_question_count: number;
    }) =>
      request<PracticeSession>('/practice/sessions/', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    getSession: (id: string) =>
      request<PracticeSession>(`/practice/sessions/${id}/`),
    abandonSession: (id: string) =>
      request<PracticeSession>(`/practice/sessions/${id}/abandon/`, {
        method: 'POST',
      }),
    completeSession: (id: string) =>
      request<PracticeSession>(`/practice/sessions/${id}/complete/`, {
        method: 'POST',
      }),
    getCurrentChallenge: (sessionId: string) =>
      request<SessionChallengeData>(`/practice/sessions/${sessionId}/current-challenge/`),
    getNextChallenge: (sessionId: string) =>
      request<SessionChallengeData>(`/practice/sessions/${sessionId}/next-challenge/`, {
        method: 'POST',
      }),
    skipChallenge: (sessionId: string) =>
      request<SessionChallengeData>(`/practice/sessions/${sessionId}/skip-challenge/`, {
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
    getAnalytics: (track?: string, year?: number | string) => {
      const params = new URLSearchParams();
      if (track) params.append('track', track);
      if (year) params.append('year', String(year));
      const queryString = params.toString() ? `?${params.toString()}` : '';
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
          is_future?: boolean;
        }>;
        heatmap_meta: {
          total_submissions: number;
          active_days: number;
          current_streak: number;
          peak_streak: number;
          completion_rate: number;
          weeks_count: number;
          selected_year: number;
          available_years: number[];
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
      }>(`/practice/analytics/${queryString}`);
    },
  },
  challenges: {
    getChallenge: (id: string) =>
      request<ChallengeDetail>(`/challenges/${id}/`),
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
