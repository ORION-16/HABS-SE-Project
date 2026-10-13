import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Unauthorized = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 bg-gradient-animated">
      <div className="glass-card p-8 max-w-md w-full text-center animate-fade-in">
        <div className="text-6xl mb-4">🚫</div>
        <h1 className="text-2xl font-bold text-[var(--habs-text)] mb-2">Access Denied</h1>
        <p className="text-[var(--habs-text-muted)] mb-6">
          You don't have permission to access this page.
        </p>
        <div className="flex flex-col gap-3">
          {isAuthenticated ? (
            <Link to="/dashboard" className="btn-primary w-full">
              Go to Dashboard
            </Link>
          ) : (
            <Link to="/login" className="btn-primary w-full">
              Go to Login
            </Link>
          )}
          <Link to="/" className="btn-secondary w-full">
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
