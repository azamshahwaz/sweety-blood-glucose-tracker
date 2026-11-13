
import {
  Navigate,
  Outlet,
  useLocation,
} from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import FullPageLoader from '../components/common/FullPageLoader';

export function getHomePath(role) {
  switch (role) {
    case 'DOCTOR':
      return '/doctor';

    case 'ADMIN':
      return '/admin';

    case 'PATIENT':
    default:
      return '/dashboard';
  }
}

export function canAccessPath(role, pathname) {
  if (!pathname || typeof pathname !== 'string') {
    return false;
  }

  switch (role) {
    case 'PATIENT':
      return [
        '/dashboard',
        '/readings',
        '/reports',
      ].includes(pathname);

    case 'DOCTOR':
      return (
        pathname === '/doctor' ||
        /^\/doctor\/patients\/[^/]+$/.test(pathname)
      );

    case 'ADMIN':
      return pathname === '/admin';

    default:
      return false;
  }
}

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <FullPageLoader />;
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <FullPageLoader />;
  }

  if (user) {
    return (
      <Navigate
        to={getHomePath(user.role)}
        replace
      />
    );
  }

  return <Outlet />;
}

export function RoleRoute({ roles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <FullPageLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!roles.includes(user.role)) {
    return (
      <Navigate
        to={getHomePath(user.role)}
        replace
      />
    );
  }

  return <Outlet />;
}
