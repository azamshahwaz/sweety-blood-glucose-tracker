import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import Logo from '../components/common/Logo';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-base-200 px-4 text-center">
      <Logo size="lg" />
      <p className="text-7xl font-extrabold text-primary">404</p>
      <h1 className="text-xl font-bold">Page not found</h1>
      <p className="max-w-sm text-sm text-muted">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
      <Link to="/dashboard" className="btn-sweety"><Home className="h-4 w-4" aria-hidden="true" />Back to Dashboard</Link>
    </div>
  );
}
