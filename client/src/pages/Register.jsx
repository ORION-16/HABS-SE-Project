import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
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
        setSuccess(true);
        toast.success('Registration successful!');
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
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 bg-gradient-animated">
        <div className="glass-card p-8 max-w-md w-full text-center animate-fade-in">
          <div className="text-5xl mb-4">📧</div>
          <h2 className="text-2xl font-bold text-[var(--habs-text)] mb-2">Check Your Email</h2>
          <p className="text-[var(--habs-text-muted)] mb-6">
            We've sent a verification link to your email address. Please verify your account to login.
          </p>
          {selectedRole === 'doctor' && (
            <div className="p-4 rounded-lg bg-[var(--habs-warning)]/10 border border-[var(--habs-warning)]/25 mb-6">
              <p className="text-sm text-[var(--habs-warning)]">
                ⚠️ Doctor accounts require admin approval after email verification.
              </p>
            </div>
          )}
          <Link to="/login" className="btn-primary w-full">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8 bg-gradient-animated">
      <div className="glass-card p-8 max-w-lg w-full animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[var(--habs-primary)] to-[var(--habs-secondary)] flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-[var(--habs-primary)]/25">
            H
          </div>
          <h1 className="text-2xl font-bold text-[var(--habs-text)]">Create Account</h1>
          <p className="text-sm text-[var(--habs-text-muted)] mt-1">Join HABS today</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Role Selector */}
          <div>
            <label className="label-habs">I am a</label>
            <div className="grid grid-cols-2 gap-3">
              {['patient', 'doctor'].map((r) => (
                <label
                  key={r}
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedRole === r
                      ? 'border-[var(--habs-primary)] bg-[var(--habs-primary)]/10 text-[var(--habs-primary-light)]'
                      : 'border-[var(--habs-border)] text-[var(--habs-text-muted)] hover:border-[var(--habs-primary)]/50'
                  }`}
                >
                  <input type="radio" value={r} {...register('role')} className="sr-only" />
                  <span className="text-lg">{r === 'patient' ? '🧑‍💼' : '🩺'}</span>
                  <span className="font-medium capitalize">{r}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="label-habs">Full Name</label>
            <input {...register('name')} className="input-habs" placeholder="John Doe" />
            {errors.name && <p className="error-text">{errors.name.message}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="label-habs">Email</label>
            <input {...register('email')} type="email" className="input-habs" placeholder="john@example.com" />
            {errors.email && <p className="error-text">{errors.email.message}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="label-habs">Phone Number</label>
            <input {...register('phone')} className="input-habs" placeholder="9876543210" />
            {errors.phone && <p className="error-text">{errors.phone.message}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="label-habs">Password</label>
            <input {...register('password')} type="password" className="input-habs" placeholder="Min. 8 characters" />
            {errors.password && <p className="error-text">{errors.password.message}</p>}
          </div>

          {/* Patient-only: Date of Birth */}
          {selectedRole === 'patient' && (
            <div className="animate-fade-in">
              <label className="label-habs">Date of Birth</label>
              <input {...register('dateOfBirth')} type="date" className="input-habs" />
            </div>
          )}

          {/* Doctor-only: Specialization + License */}
          {selectedRole === 'doctor' && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="label-habs">Specialization</label>
                <input {...register('specialization')} className="input-habs" placeholder="e.g. Cardiology" />
                {errors.specialization && <p className="error-text">{errors.specialization.message}</p>}
              </div>
              <div>
                <label className="label-habs">License Number</label>
                <input {...register('licenseNumber')} className="input-habs" placeholder="e.g. MH-12345" />
                {errors.licenseNumber && <p className="error-text">{errors.licenseNumber.message}</p>}
              </div>
            </div>
          )}

          {/* Submit */}
          <button type="submit" disabled={submitting} className="btn-primary w-full mt-2">
            {submitting ? (
              <span className="animate-pulse-glow">Creating Account...</span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-sm text-[var(--habs-text-muted)] mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-[var(--habs-primary-light)] hover:underline font-medium">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
