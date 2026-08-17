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
      return { user: null, error: error.message };
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
      return { user: null, error: error.message };
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
      return { error: error.message };
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
