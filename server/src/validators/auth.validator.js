const { z } = require('zod');

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  email: z.string().email('Invalid email address').toLowerCase(),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['patient', 'doctor', 'admin'], {
    errorMap: () => ({ message: 'Role must be patient, doctor, or admin' }),
  }),

  // Patient-only
  dateOfBirth: z.string().datetime({ offset: true }).optional()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date format must be YYYY-MM-DD').optional()),

  // Doctor-only
  specialization: z.string().optional(),
  licenseNumber: z.string().optional(),
}).refine(
  (data) => {
    if (data.role === 'doctor') {
      return data.specialization && data.licenseNumber;
    }
    return true;
  },
  {
    message: 'Doctors must provide specialization and licenseNumber',
    path: ['specialization'],
  }
);

const loginSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
});

const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

/**
 * Express middleware factory for Zod validation.
 */
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }
  req.validatedBody = result.data;
  next();
};

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  validate,
};
