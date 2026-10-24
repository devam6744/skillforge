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
