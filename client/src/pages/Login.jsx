import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../api/auth.api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const Login = () => {
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const res = await loginUser(data);

      if (res.data.success) {
        const { token, user } = res.data.data;
        login(token, user);
        toast.success(`Welcome back, ${user.name}!`);

        // Redirect by role
        switch (user.role) {
          case 'doctor':
            navigate('/doctor/availability');
            break;
          case 'admin':
            navigate('/admin');
            break;
          default:
            navigate('/dashboard');
        }
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 bg-gradient-animated">
      <div className="glass-card p-8 max-w-md w-full animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[var(--habs-primary)] to-[var(--habs-secondary)] flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-[var(--habs-primary)]/25">
            H
          </div>
          <h1 className="text-2xl font-bold text-[var(--habs-text)]">Welcome Back</h1>
          <p className="text-sm text-[var(--habs-text-muted)] mt-1">Sign in to your HABS account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email */}
          <div>
            <label className="label-habs">Email</label>
            <input
              {...register('email')}
              type="email"
              className="input-habs"
              placeholder="your@email.com"
              autoComplete="email"
            />
            {errors.email && <p className="error-text">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="label-habs">Password</label>
            <input
              {...register('password')}
              type="password"
              className="input-habs"
              placeholder="Enter your password"
              autoComplete="current-password"
            />
            {errors.password && <p className="error-text">{errors.password.message}</p>}
          </div>

          {/* Forgot Password */}
          <div className="flex justify-end">
            <Link
              to="/forgot-password"
              className="text-xs text-[var(--habs-primary-light)] hover:underline"
            >
              Forgot your password?
            </Link>
          </div>

          {/* Submit */}
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? (
              <span className="animate-pulse-glow">Signing in...</span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Security note */}
        <div className="mt-6 p-3 rounded-lg bg-[var(--habs-bg)]/40 border border-[var(--habs-border)]/50">
          <p className="text-xs text-[var(--habs-text-muted)] text-center">
            🔒 Your account will be locked after 5 failed attempts for 15 minutes
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-[var(--habs-text-muted)] mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-[var(--habs-primary-light)] hover:underline font-medium">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
