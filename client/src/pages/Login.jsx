import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Stethoscope,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { loginUser } from '../api/auth.api';
import { useAuth } from '../context/AuthContext';
import ShinyText from '../components/react-bits/ShinyText';
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
    setValue,
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

        if (user.role === 'doctor') {
          navigate('/doctor/availability');
        } else {
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

  const fillDemoAccount = (role) => {
    if (role === 'doctor') {
      setValue('email', 'doctor@habs.com');
      setValue('password', 'Password@123');
      toast.success('Filled Demo Doctor credentials');
    } else {
      setValue('email', 'patient@habs.com');
      setValue('password', 'Password@123');
      toast.success('Filled Demo Patient credentials');
    }
  };

  return (
    <div className="min-h-screen bg-[#eceef7] flex items-center justify-center p-4 sm:p-6 antialiased selection:bg-indigo-500 selection:text-white">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-[460px] bg-white rounded-[32px] sm:rounded-[36px] border border-[#e8ecf4] shadow-[0_20px_50px_-12px_rgba(20,24,45,0.08)] p-6 sm:p-9 relative overflow-hidden"
      >
        {/* Brand Header */}
        <div className="text-center mb-7">
          <div className="w-14 h-14 mx-auto mb-3.5 rounded-2xl bg-gradient-to-tr from-[#6956e5] via-[#7d67f5] to-[#9a87fc] flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
            <Stethoscope className="w-7 h-7" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#171825] tracking-tight">
            Welcome Back
          </h2>
          <p className="text-xs sm:text-sm font-semibold text-[#8e94a5] mt-1">
            Access your HABS Healthcare Portal
          </p>
        </div>

        {/* Demo Account Fill Shortcuts */}
        <div className="mb-6 p-3 rounded-2xl bg-[#f8f9fd] border border-slate-100 flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold text-slate-500">Quick Test:</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fillDemoAccount('doctor')}
              className="text-xs font-bold px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
            >
              🩺 Doctor
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount('patient')}
              className="text-xs font-bold px-2.5 py-1 rounded-xl bg-cyan-50 text-cyan-700 hover:bg-cyan-100 transition-colors"
            >
              🧑‍💼 Patient
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-[#171825] mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                {...register('email')}
                type="email"
                placeholder="name@example.com"
                className="habs-input !pl-10"
                autoComplete="email"
              />
            </div>
            {errors.email && <p className="text-[11px] font-bold text-rose-500 mt-1">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-[#171825]">Password</label>
              <Link to="/forgot-password" className="text-[11px] font-bold text-indigo-600 hover:underline">
                Forgot?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                {...register('password')}
                type="password"
                placeholder="••••••••••••"
                className="habs-input !pl-10"
                autoComplete="current-password"
              />
            </div>
            {errors.password && <p className="text-[11px] font-bold text-rose-500 mt-1">{errors.password.message}</p>}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="habs-btn-primary w-full !py-3 mt-2"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Signing in...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Sign In to Account <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>
        </form>

        {/* Security Lockout Banner */}
        <div className="mt-6 p-3 rounded-2xl bg-amber-50/70 border border-amber-100 flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="text-[11px] font-medium text-amber-800">
            5 failed login attempts triggers automatic 15-min lockout.
          </p>
        </div>

        {/* Switch to Register */}
        <p className="text-center text-xs font-semibold text-[#8e94a5] mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-[#6956e5] hover:underline">
            Register here
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
