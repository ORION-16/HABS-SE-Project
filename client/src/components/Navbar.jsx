import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logoutUser } from '../api/auth.api';
import toast from 'react-hot-toast';

const Navbar = () => {
  const { isAuthenticated, user, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch {
      // Continue with local logout even if API call fails
    }
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <nav className="glass-card rounded-none border-x-0 border-t-0 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[var(--habs-primary)] to-[var(--habs-secondary)] flex items-center justify-center text-white font-bold text-sm group-hover:shadow-lg group-hover:shadow-[var(--habs-primary)]/30 transition-shadow">
              H
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-[var(--habs-primary-light)] to-[var(--habs-secondary)] bg-clip-text text-transparent">
              HABS
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                {role === 'patient' && (
                  <Link
                    to="/dashboard"
                    className="text-sm text-[var(--habs-text-muted)] hover:text-[var(--habs-text)] transition-colors"
                  >
                    Dashboard
                  </Link>
                )}
                {role === 'doctor' && (
                  <Link
                    to="/doctor/availability"
                    className="text-sm text-[var(--habs-text-muted)] hover:text-[var(--habs-text)] transition-colors"
                  >
                    My Availability
                  </Link>
                )}

                {/* User info */}
                <div className="flex items-center gap-3 ml-2">
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium text-[var(--habs-text)]">{user?.name}</p>
                    <p className="text-xs text-[var(--habs-text-muted)] capitalize">{role}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--habs-accent)] to-[var(--habs-primary)] flex items-center justify-center text-white text-sm font-semibold">
                    {user?.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="btn-secondary !py-1.5 !px-3 !text-xs"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-secondary !py-1.5 !px-4 !text-sm">
                  Login
                </Link>
                <Link to="/register" className="btn-primary !py-1.5 !px-4 !text-sm">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
