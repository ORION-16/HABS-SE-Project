import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
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
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 bg-gradient-animated">
      <div className="glass-card p-8 max-w-md w-full text-center animate-fade-in">
        {status === 'verifying' && (
          <>
            <div className="text-5xl mb-4 animate-bounce">⏳</div>
            <h2 className="text-2xl font-bold text-[var(--habs-text)] mb-2">Verifying Email</h2>
            <p className="text-[var(--habs-text-muted)]">Please wait while we confirm your account...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-[var(--habs-text)] mb-2">Email Verified!</h2>
            <p className="text-[var(--habs-text-muted)] mb-6">{message}</p>
            <Link to="/login" className="btn-primary w-full">
              Proceed to Login
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-5xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-[var(--habs-danger)] mb-2">Verification Failed</h2>
            <p className="text-[var(--habs-text-muted)] mb-6">{message}</p>
            <Link to="/register" className="btn-secondary w-full">
              Back to Registration
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
