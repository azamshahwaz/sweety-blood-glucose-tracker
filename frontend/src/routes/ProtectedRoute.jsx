import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FullPageLoader from '../components/common/FullPageLoader';

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { user, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  if (user) return <Navigate to={user.role === 'DOCTOR' ? '/doctor' : user.role === 'ADMIN' ? '/admin' : '/dashboard'} replace />;
  return <Outlet />;
}

export function RoleRoute({ roles }) {
  const { user, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role || 'PATIENT')) return <Navigate to={user.role === 'DOCTOR' ? '/doctor' : user.role === 'ADMIN' ? '/admin' : '/dashboard'} replace />;
  return <Outlet />;
}
