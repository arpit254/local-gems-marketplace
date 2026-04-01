import { FormEvent, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthApiError } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getAuthenticatedHomeRoute, useAuth } from '@/lib/auth';

function getAuthErrorMessage(error: unknown) {
  if (error instanceof AuthApiError) {
    return 'Invalid login credentials.';
  }

  if (error instanceof Error || typeof error === 'object' || typeof error === 'string') {
    return 'Invalid login credentials.';
  }

  return 'Invalid login credentials.';
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasVendorProfile, isAuthenticated, isLoading, profile, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState(
    typeof location.state?.message === 'string' ? location.state.message : ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !profile) {
      return;
    }

    const from = typeof location.state?.from === 'string' ? location.state.from : null;
    const fallbackRoute = getAuthenticatedHomeRoute(profile, hasVendorProfile);
    navigate(from ?? fallbackRoute, { replace: true });
  }, [hasVendorProfile, isAuthenticated, location.state, navigate, profile]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      const result = await signIn({ email, password });
      const from = typeof location.state?.from === 'string' ? location.state.from : null;
      const fallbackRoute = getAuthenticatedHomeRoute(result.profile, result.hasVendorProfile);
      navigate(from ?? fallbackRoute, { replace: true });
    } catch (error) {
      console.error('[auth-ui] Login submission failed', error);
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-card border rounded-2xl shadow-card p-6 md:p-8">
        <div className="mb-6 text-center">
          <h1 className="font-display text-3xl font-bold text-foreground">Log in</h1>
          <p className="mt-2 text-sm text-muted-foreground">Access your LocalKart account and continue shopping.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="Enter your password"
              required
            />
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
            {isSubmitting ? 'Logging in...' : 'Log in'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="text-primary font-medium hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
