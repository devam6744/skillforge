export interface UserProfile {
  display_name: string;
  username?: string | null;
  bio?: string;
  initial_skill_level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  onboarding_completed: boolean;
}

export interface User {
  id: string;
  email: string;
  is_email_verified: boolean;
  date_joined: string;
  profile: UserProfile | null;
}

export interface AuthResponse {
  message: string;
  user: User;
  is_new_user?: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface Topic {
  id: string;
  slug: string;
  name: string;
  description: string;
  sort_order: number;
}

export interface ProgrammingLanguage {
  id: string;
  slug: string;
  name: string;
  sort_order: number;
  topics: Topic[];
}

export interface PracticeSession {
  id: string;
  language_name: string;
  language_slug: string;
  practice_type: 'TOPIC' | 'MIXED';
  topic_name?: string | null;
  topic_slug?: string | null;
  difficulty_mode: 'EASY' | 'MEDIUM' | 'HARD' | 'ADAPTIVE';
  practice_mode: 'CODING' | 'DEBUG';
  requested_question_count: number;
  status: 'CREATED' | 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
  started_at?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChallengeDetail {
  id: string;
  title: string;
  statement: string;
  constraints_text: string;
  examples: Array<{ input: string; output: string }>;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  practice_mode: 'CODING' | 'DEBUG';
  target_concepts: string[];
  starter_code: string;
  hints: string[];
  language_name: string;
  language_slug: string;
  topic_name: string;
  topic_slug: string;
  origin: string;
  quality_status: string;
  created_at: string;
}

export interface SessionChallengeData {
  id: string;
  question_order: number;
  total_questions: number;
  status: 'ACTIVE' | 'SOLVED' | 'SKIPPED';
  is_last_question: boolean;
  challenge: ChallengeDetail;
  started_at: string;
  completed_at?: string | null;
  session_finished?: boolean;
  detail?: string;
}
