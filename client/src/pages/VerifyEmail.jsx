import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { verifyEmail } from '../api/auth.api';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided in URL.');
      return;
    }

    const verify = async () => {
      try {
        const res = await verifyEmail(token);
        setStatus('success');
        setMessage(res.data.message || 'Email verified successfully!');
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Failed to verify email. Token may be invalid or expired.');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-[#eceef7] flex items-center justify-center p-4 sm:p-6 antialiased">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[460px] bg-white rounded-[32px] sm:rounded-[36px] border border-[#e8ecf4] shadow-[0_20px_50px_-12px_rgba(20,24,45,0.08)] p-8 sm:p-10 text-center"
      >
        {status === 'verifying' && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-indigo-50 text-[#6956e5] flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <h2 className="text-2xl font-extrabold text-[#171825]">Verifying Email</h2>
            <p className="text-xs font-semibold text-[#8e94a5] mt-2">
              Validating your JWT signed token with HABS...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-extrabold text-[#171825]">Email Verified!</h2>
            <p className="text-xs font-semibold text-[#8e94a5] mt-2 leading-relaxed">
              {message} You can now log into your account.
            </p>
            <Link to="/login" className="habs-btn-primary w-full !py-3 mt-6">
              Proceed to Login <ArrowRight className="w-4 h-4" />
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-extrabold text-[#171825]">Verification Failed</h2>
            <p className="text-xs font-semibold text-rose-600 mt-2 leading-relaxed">
              {message}
            </p>
            <Link to="/register" className="habs-btn-secondary w-full !py-3 mt-6">
              Back to Registration
            </Link>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default VerifyEmail;
