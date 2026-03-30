import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';

export default function AuthRedirect() {
  const { isAuthenticated, isLoading, profile } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading your dashboard...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!profile) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Finalizing your account...</p>
      </div>
    );
  }

  if (profile?.role === 'vendor') {
    return <Navigate to="/vendor" replace />;
  }

  return <Navigate to="/customer" replace />;
}
