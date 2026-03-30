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

type AuthContextValue = {
  isAuthenticated: boolean;
  isLoading: boolean;
  profile: UserProfile | null;
  session: Session | null;
  signIn: (input: SignInInput) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
  user: User | null;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function fetchProfile(userId: string) {
  const result = await supabase
    .from('users')
    .select('id, email, name, role')
    .eq('id', userId)
    .maybeSingle();

  if (result.error) {
    throw result.error;
  }

  return result.data as UserProfile | null;
}

async function upsertProfile(profile: UserProfile) {
  const result = await supabase.from('users').upsert(profile).select('id, email, name, role').single();

  if (result.error) {
    throw result.error;
  }

  return result.data as UserProfile;
}

async function ensureProfile(user: User) {
  const existingProfile = await fetchProfile(user.id);

  if (existingProfile) {
    return existingProfile;
  }

  const role = user.user_metadata.role === 'vendor' ? 'vendor' : 'customer';
  const name = typeof user.user_metadata.name === 'string' && user.user_metadata.name.trim()
    ? user.user_metadata.name.trim()
    : (user.email?.split('@')[0] ?? 'User');

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

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
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
      const result = await supabase.auth.signInWithPassword({ email, password });

      if (result.error) {
        throw result.error;
      }
    },
    signOut: async () => {
      const result = await supabase.auth.signOut();

      if (result.error) {
        throw result.error;
      }
    },
    signUp: async ({ email, name, password, role }) => {
      const result = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role,
          },
        },
      });

      if (result.error) {
        throw result.error;
      }

      if (result.data.user && result.data.session) {
        const savedProfile = await upsertProfile({
          email,
          id: result.data.user.id,
          name,
          role,
        });
        setProfile(savedProfile);
      }
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
