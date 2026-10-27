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
  const [requiresEmailVerification, setRequiresEmailVerification] = useState(false);

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
        setRequiresEmailVerification(Boolean(res.data.data?.requiresEmailVerification));
        setSuccess(true);
        toast.success(res.data.message || 'Registration successful! You can sign in now.');
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 antialiased">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white rounded-3xl border border-slate-200/80 shadow-md p-8 sm:p-10 text-center space-y-4"
        >
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <MailCheck className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
            {requiresEmailVerification ? 'Check Your Email' : 'Account Created'}
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            {requiresEmailVerification ? (
              <>We sent a verification link to <strong className="text-slate-800">{registeredEmail}</strong>. Click the link in the message to activate your account.</>
            ) : (
              <>Your account for <strong className="text-slate-800">{registeredEmail}</strong> is ready. Sign in to continue.</>
            )}
          </p>
          <div className="pt-4">
            <Link
              to="/login"
              className="habs-btn-primary w-full inline-flex justify-center"
            >
              Back to Login
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 sm:p-10 antialiased">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-lg bg-white rounded-3xl border border-slate-200/80 shadow-md p-8 sm:p-10 space-y-6"
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
            <Stethoscope className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Create an Account
          </h1>
          <p className="text-sm text-slate-500">
            Join the HABS Healthcare Platform
          </p>
        </div>

        {/* Role Toggle Tabs */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-100 border border-slate-200">
          <button
            type="button"
            onClick={() => setValue('role', 'patient')}
            className={`py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
              selectedRole === 'patient'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>🧑‍💼</span> Patient
          </button>
          <button
            type="button"
            onClick={() => setValue('role', 'doctor')}
            className={`py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
              selectedRole === 'doctor'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>🩺</span> Doctor
          </button>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                {...register('name')}
                placeholder="Jane Doe"
                className="habs-input !pl-10"
              />
            </div>
            {errors.name && <p className="text-xs text-rose-500 font-medium">{errors.name.message}</p>}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                {...register('email')}
                type="email"
                placeholder="jane@example.com"
                className="habs-input !pl-10"
              />
            </div>
            {errors.email && <p className="text-xs text-rose-500 font-medium">{errors.email.message}</p>}
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Phone Number</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                {...register('phone')}
                placeholder="9876543210"
                className="habs-input !pl-10"
              />
            </div>
            {errors.phone && <p className="text-xs text-rose-500 font-medium">{errors.phone.message}</p>}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                {...register('password')}
                type="password"
                placeholder="Min. 8 characters"
                className="habs-input !pl-10"
              />
            </div>
            {errors.password && <p className="text-xs text-rose-500 font-medium">{errors.password.message}</p>}
          </div>

          {/* Patient: Date of Birth */}
          {selectedRole === 'patient' && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">Date of Birth</label>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Specialization</label>
                <div className="relative">
                  <Award className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    {...register('specialization')}
                    placeholder="e.g. Cardiology"
                    className="habs-input !pl-10"
                  />
                </div>
                {errors.specialization && <p className="text-xs text-rose-500 font-medium">{errors.specialization.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">License No.</label>
                <div className="relative">
                  <FileBadge className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    {...register('licenseNumber')}
                    placeholder="MH-12345"
                    className="habs-input !pl-10"
                  />
                </div>
                {errors.licenseNumber && <p className="text-xs text-rose-500 font-medium">{errors.licenseNumber.message}</p>}
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="habs-btn-primary w-full !h-12 !text-sm mt-3"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Creating account...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Create Account <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500 pt-2">
          Already registered?{' '}
          <Link
            to="/login"
            className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;
