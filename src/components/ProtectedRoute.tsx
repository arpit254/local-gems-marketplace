import { Navigate, useLocation } from 'react-router-dom';
import { canAccessVendorDashboard, useAuth, type AppRole } from '@/lib/auth';

export default function ProtectedRoute({
  children,
  requiredRoles,
  requiredRole,
}: {
  children: JSX.Element;
  requiredRole?: AppRole;
  requiredRoles?: AppRole[];
}) {
  const { hasVendorProfile, isAuthenticated, isLoading, profile } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading your account...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const allowedRoles = requiredRoles ?? (requiredRole ? [requiredRole] : undefined);

  if ((requiredRole === 'vendor' || requiredRoles?.includes('vendor')) && !canAccessVendorDashboard(profile, hasVendorProfile)) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles && (!profile || !allowedRoles.includes(profile.role))) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
