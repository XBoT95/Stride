import { createClient as createServerClient } from '@/lib/supabase/server';

export interface SignUpInput {
  email: string;
  password: string;
  fullName?: string;
}

export interface SignInInput {
  email: string;
  password: string;
}

export class AuthService {
  /**
   * Maps raw Supabase Auth provider errors into calm, user-facing natural language per docs/error-philosophy.md.
   */
  private static mapAuthError(rawMessage: string): string {
    const lower = rawMessage.toLowerCase();

    if (
      lower.includes('invalid login credentials') ||
      lower.includes('invalid credentials')
    ) {
      return 'The email or password you entered is incorrect. Please double-check and try again.';
    }
    if (
      lower.includes('already registered') ||
      lower.includes('already in use') ||
      lower.includes('user_already_exists')
    ) {
      return 'An account with this email address already exists. Please sign in instead.';
    }
    if (
      lower.includes('password should be at least') ||
      lower.includes('weak_password') ||
      lower.includes('password')
    ) {
      return 'Password must be at least 6 characters long.';
    }

    return 'Unable to authenticate. Please try again in a moment.';
  }

  /**
   * Register a new user using Supabase Auth.
   * Passing fullName in user metadata triggers public.handle_new_user() in PostgreSQL.
   */
  static async signUp({ email, password, fullName }: SignUpInput) {
    const supabase = await createServerClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || '',
        },
      },
    });

    if (error) {
      return { user: null, error: this.mapAuthError(error.message) };
    }

    return { user: data.user, error: null };
  }

  /**
   * Authenticate an existing user with email and password.
   */
  static async signIn({ email, password }: SignInInput) {
    const supabase = await createServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { user: null, error: this.mapAuthError(error.message) };
    }

    return { user: data.user, session: data.session, error: null };
  }

  /**
   * Sign out the currently authenticated user.
   */
  static async signOut() {
    const supabase = await createServerClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { error: 'Unable to sign out right now. Please try again.' };
    }
    return { error: null };
  }

  /**
   * Get the current authenticated user from server session.
   */
  static async getUser() {
    const supabase = await createServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return user;
  }

  /**
   * Get the public profile for the authenticated user.
   */
  static async getProfile() {
    const user = await this.getUser();
    if (!user) return null;

    const supabase = await createServerClient();
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error || !profile) {
      return null;
    }

    return profile;
  }
}
