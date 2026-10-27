import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Unauthorized = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen habs-state-shell flex items-center justify-center p-4 sm:p-6 antialiased">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[440px] habs-state-card p-8 sm:p-10 text-center"
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-extrabold text-[#171825]">Access Restricted</h1>
        <p className="text-xs font-semibold text-[#8e94a5] mt-2 mb-6 leading-relaxed">
          You do not have the required role privileges to access this resource. Doctor availability settings are strictly reserved for clinician accounts.
        </p>

        <div className="space-y-3">
          {isAuthenticated ? (
            <Link to="/dashboard" className="habs-btn-primary w-full !py-3">
              Return to Dashboard
            </Link>
          ) : (
            <Link to="/login" className="habs-btn-primary w-full !py-3">
              Sign In with Authorized Account
            </Link>
          )}
          <Link to="/" className="habs-btn-secondary w-full !py-3">
            <ArrowLeft className="w-4 h-4 mr-1" /> Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Unauthorized;
