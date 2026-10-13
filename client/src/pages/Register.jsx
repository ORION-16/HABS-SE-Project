import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Stethoscope,
  User,
  Mail,
  Phone,
  Lock,
  Calendar,
  Award,
  FileBadge,
  ArrowRight,
  CheckCircle2,
  MailCheck
} from 'lucide-react';
import { registerUser } from '../api/auth.api';
import toast from 'react-hot-toast';

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['patient', 'doctor']),
  dateOfBirth: z.string().optional(),
  specialization: z.string().optional(),
  licenseNumber: z.string().optional(),
}).refine(
  (data) => {
    if (data.role === 'doctor') {
      return data.specialization && data.licenseNumber;
    }
    return true;
  },
  { message: 'Doctors must provide specialization and license number', path: ['specialization'] }
);

const Register = () => {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'patient',
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const payload = { ...data };
      if (data.role === 'patient') {
        delete payload.specialization;
        delete payload.licenseNumber;
      } else {
        delete payload.dateOfBirth;
      }

      const res = await registerUser(payload);
      if (res.data.success) {
        setRegisteredEmail(data.email);
        setSuccess(true);
        toast.success('Registration successful! Check your email.');
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#eceef7] flex items-center justify-center p-4 sm:p-6 antialiased">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-[460px] bg-white rounded-[32px] sm:rounded-[36px] border border-[#e8ecf4] shadow-[0_20px_50px_-12px_rgba(20,24,45,0.08)] p-8 sm:p-10 text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-indigo-50 text-[#6956e5] flex items-center justify-center shadow-inner">
            <MailCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#171825]">Check Your Email</h2>
          <p className="text-xs font-semibold text-[#8e94a5] mt-2 leading-relaxed">
            We sent a verification token to <strong className="text-gray-800">{registeredEmail}</strong>.
            Click the link in the email or proceed to login once confirmed.
          </p>

          {selectedRole === 'doctor' && (
            <div className="mt-4 p-3 rounded-2xl bg-amber-50 text-amber-800 text-xs font-semibold border border-amber-100">
              ⚠️ Doctor accounts also require admin approval after email verification.
            </div>
          )}

          <Link
            to="/login"
            className="habs-btn-primary w-full !py-3 mt-6"
          >
            Go to Login Page
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#eceef7] flex items-center justify-center p-4 sm:p-6 antialiased selection:bg-indigo-500 selection:text-white">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-[500px] bg-white rounded-[32px] sm:rounded-[36px] border border-[#e8ecf4] shadow-[0_20px_50px_-12px_rgba(20,24,45,0.08)] p-6 sm:p-9 relative overflow-hidden"
      >
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3.5 rounded-2xl bg-gradient-to-tr from-[#6956e5] via-[#7d67f5] to-[#9a87fc] flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
            <Stethoscope className="w-7 h-7" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#171825] tracking-tight">
            Create Account
          </h2>
          <p className="text-xs sm:text-sm font-semibold text-[#8e94a5] mt-1">
            Join HABS Healthcare System
          </p>
        </div>

        {/* Role Toggle Tabs */}
        <div className="grid grid-cols-2 p-1.5 rounded-2xl bg-[#f4f5fb] border border-slate-100 mb-5">
          <button
            type="button"
            onClick={() => setValue('role', 'patient')}
            className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              selectedRole === 'patient'
                ? 'bg-white text-[#171825] shadow-sm font-extrabold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>🧑‍💼</span> Patient
          </button>
          <button
            type="button"
            onClick={() => setValue('role', 'doctor')}
            className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              selectedRole === 'doctor'
                ? 'bg-white text-[#171825] shadow-sm font-extrabold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>🩺</span> Doctor
          </button>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-[#171825] mb-1">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                {...register('name')}
                placeholder="Jane Doe"
                className="habs-input !pl-10"
              />
            </div>
            {errors.name && <p className="text-[11px] font-bold text-rose-500 mt-1">{errors.name.message}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-[#171825] mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                {...register('email')}
                type="email"
                placeholder="jane@example.com"
                className="habs-input !pl-10"
              />
            </div>
            {errors.email && <p className="text-[11px] font-bold text-rose-500 mt-1">{errors.email.message}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-bold text-[#171825] mb-1">Phone Number</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                {...register('phone')}
                placeholder="9876543210"
                className="habs-input !pl-10"
              />
            </div>
            {errors.phone && <p className="text-[11px] font-bold text-rose-500 mt-1">{errors.phone.message}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-[#171825] mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                {...register('password')}
                type="password"
                placeholder="Min. 8 characters"
                className="habs-input !pl-10"
              />
            </div>
            {errors.password && <p className="text-[11px] font-bold text-rose-500 mt-1">{errors.password.message}</p>}
          </div>

          {/* Patient: Date of Birth */}
          {selectedRole === 'patient' && (
            <div>
              <label className="block text-xs font-bold text-[#171825] mb-1">Date of Birth</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  {...register('dateOfBirth')}
                  type="date"
                  className="habs-input !pl-10"
                />
              </div>
            </div>
          )}

          {/* Doctor: Specialization & License */}
          {selectedRole === 'doctor' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-[#171825] mb-1">Specialization</label>
                <div className="relative">
                  <Award className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    {...register('specialization')}
                    placeholder="e.g. Cardiology"
                    className="habs-input !pl-10"
                  />
                </div>
                {errors.specialization && <p className="text-[11px] font-bold text-rose-500 mt-1">{errors.specialization.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#171825] mb-1">License No.</label>
                <div className="relative">
                  <FileBadge className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    {...register('licenseNumber')}
                    placeholder="MH-12345"
                    className="habs-input !pl-10"
                  />
                </div>
                {errors.licenseNumber && <p className="text-[11px] font-bold text-rose-500 mt-1">{errors.licenseNumber.message}</p>}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="habs-btn-primary w-full !py-3 mt-4"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Registering...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Create Account <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-xs font-semibold text-[#8e94a5] mt-5">
          Already registered?{' '}
          <Link to="/login" className="font-bold text-[#6956e5] hover:underline">
            Login here
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;
