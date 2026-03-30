import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'customer' | 'vendor';

export type UserProfile = {
  id: string;
  email: string;
  name: string;
  role: AppRole;
};

type SignUpInput = {
  email: string;
  name: string;
  password: string;
  role: AppRole;
};

type SignInInput = {
  email: string;
  password: string;
};

type SignInResult = {
  profile: UserProfile;
};

type SignUpResult = {
  profile: UserProfile | null;
  requiresEmailConfirmation: boolean;
};

type AuthContextValue = {
  isAuthenticated: boolean;
  isLoading: boolean;
  profile: UserProfile | null;
  session: Session | null;
  signIn: (input: SignInInput) => Promise<SignInResult>;
  signOut: () => Promise<void>;
  signUp: (input: SignUpInput) => Promise<SignUpResult>;
  user: User | null;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function fetchProfile(userId: string) {
  const result = await supabase
    .from('profiles')
    .select('id, email, name, role')
    .eq('id', userId)
    .maybeSingle();

  if (result.error) {
    throw result.error;
  }

  return result.data as UserProfile | null;
}

async function waitForProfile(userId: string, retries = 3, delayMs = 250) {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const profile = await fetchProfile(userId);
    if (profile) {
      return profile;
    }

    if (attempt < retries) {
      await new Promise((resolve) => window.setTimeout(resolve, delayMs));
    }
  }

  return null;
}

async function upsertProfile(profile: UserProfile) {
  const result = await supabase.from('profiles').upsert(profile).select('id, email, name, role').single();

  if (result.error) {
    throw result.error;
  }

  return result.data as UserProfile;
}

async function ensureProfile(user: User) {
  const existingProfile = await waitForProfile(user.id);

  if (existingProfile) {
    console.info('[auth] Loaded existing profile', { userId: user.id, role: existingProfile.role });
    return existingProfile;
  }

  const role = user.user_metadata.role === 'vendor' ? 'vendor' : 'customer';
  const name = typeof user.user_metadata.name === 'string' && user.user_metadata.name.trim()
    ? user.user_metadata.name.trim()
    : (user.email?.split('@')[0] ?? 'User');

  console.warn('[auth] Profile row missing, creating one from user metadata', { userId: user.id });

  return upsertProfile({
    email: user.email ?? '',
    id: user.id,
    name,
    role,
  });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadInitialSession() {
      try {
        console.info('[auth] Loading initial session');
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          throw error;
        }

        if (!isMounted) {
          return;
        }

        setSession(data.session);
        setUser(data.session?.user ?? null);

        if (data.session?.user) {
          console.info('[auth] Found persisted session', { userId: data.session.user.id });
          const nextProfile = await ensureProfile(data.session.user);
          if (isMounted) {
            setProfile(nextProfile);
          }
        }
      } catch (error) {
        console.error('Failed to initialize auth session.', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialSession();

    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      console.info('[auth] Auth state changed', {
        event,
        hasSession: Boolean(nextSession),
        userId: nextSession?.user.id ?? null,
      });
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (!nextSession?.user) {
        setProfile(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      void fetchProfile(nextSession.user.id)
        .then((nextProfile) => nextProfile ?? ensureProfile(nextSession.user))
        .then((nextProfile) => {
          if (isMounted) {
            setProfile(nextProfile);
          }
        })
        .catch((error) => {
          console.error('Failed to refresh auth profile.', error);
        })
        .finally(() => {
          if (isMounted) {
            setIsLoading(false);
          }
        });
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    isAuthenticated: Boolean(user),
    isLoading,
    profile,
    session,
    signIn: async ({ email, password }) => {
      console.info('[auth] Attempting password sign in', { email });
      const result = await supabase.auth.signInWithPassword({ email, password });

      if (result.error) {
        console.error('[auth] Sign in failed', { email, message: result.error.message });
        throw result.error;
      }

      if (!result.data.user) {
        throw new Error('Supabase did not return a user for this login attempt.');
      }

      const savedProfile = await ensureProfile(result.data.user);
      setProfile(savedProfile);

      console.info('[auth] Sign in succeeded', { userId: result.data.user.id, role: savedProfile.role });

      return { profile: savedProfile };
    },
    signOut: async () => {
      console.info('[auth] Signing out current user');
      const result = await supabase.auth.signOut();

      if (result.error) {
        console.error('[auth] Sign out failed', { message: result.error.message });
        throw result.error;
      }
    },
    signUp: async ({ email, name, password, role }) => {
      console.info('[auth] Attempting sign up', { email, role });
      const result = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role,
          },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (result.error) {
        console.error('[auth] Sign up failed', { email, message: result.error.message });
        throw result.error;
      }

      const requiresEmailConfirmation = !result.data.session;

      if (!result.data.user) {
        throw new Error('Supabase did not return a user for this signup attempt.');
      }

      console.info('[auth] Sign up succeeded', {
        userId: result.data.user.id,
        requiresEmailConfirmation,
      });

      if (requiresEmailConfirmation) {
        return {
          profile: null,
          requiresEmailConfirmation: true,
        };
      }

      const savedProfile = await ensureProfile(result.data.user);
      setProfile(savedProfile);

      return {
        profile: savedProfile,
        requiresEmailConfirmation: false,
      };
    },
    user,
  }), [isLoading, profile, session, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
