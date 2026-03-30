import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthApiError } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, type AppRole } from '@/lib/auth';

function getAuthErrorMessage(error: unknown) {
  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
    if (error.message === 'Failed to fetch') {
      return 'Unable to reach Supabase. Check your internet connection, browser extensions, and Supabase project settings.';
    }

    return error.message;
  }

  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return 'Unable to reach Supabase. Check your internet connection, browser extensions, and Supabase project settings.';
  }

  if (error instanceof AuthApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
}

export default function SignupPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, profile, signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<AppRole>('customer');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !profile) {
      return;
    }

    navigate(profile.role === 'vendor' ? '/vendor' : '/customer', { replace: true });
  }, [isAuthenticated, navigate, profile]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      const result = await signUp({ email, name, password, role });

      if (result.requiresEmailConfirmation) {
        setSuccessMessage('Account created. Please confirm your email, then log in to continue.');
        navigate('/login', {
          replace: true,
          state: {
            message: 'Account created. Check your email for the confirmation link, then log in.',
          },
        });
        return;
      }

      navigate(result.profile?.role === 'vendor' ? '/vendor' : '/customer', { replace: true });
    } catch (error) {
      console.error('[auth-ui] Signup submission failed', error);
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-card border rounded-2xl shadow-card p-6 md:p-8">
        <div className="mb-6 text-center">
          <h1 className="font-display text-3xl font-bold text-foreground">Create account</h1>
          <p className="mt-2 text-sm text-muted-foreground">Join LocalKart as a customer or vendor.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your full name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Create a password"
              minLength={6}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              value={role}
              onChange={(event) => setRole(event.target.value as AppRole)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background"
            >
              <option value="customer">Customer</option>
              <option value="vendor">Vendor</option>
            </select>
          </div>

          {errorMessage && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="rounded-lg border border-accent bg-accent px-3 py-2 text-sm text-accent-foreground">
              {successMessage}
            </div>
          )}

          <Button type="submit" className="w-full gradient-hero text-primary-foreground border-none" disabled={isSubmitting || isLoading}>
            {isSubmitting ? 'Creating account...' : 'Sign up'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
