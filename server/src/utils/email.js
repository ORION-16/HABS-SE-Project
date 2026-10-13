/**
 * Email utility — stub for development.
 * In production, wire up Nodemailer with SMTP config from .env.
 * In dev, just logs to console.
 */

const sendEmail = async ({ to, subject, html }) => {
  // DEV STUB — log to console instead of actually sending
  console.log('═══════════════════════════════════════════');
  console.log('📧 EMAIL STUB (dev mode)');
  console.log(`   To:      ${to}`);
  console.log(`   Subject: ${subject}`);
  console.log(`   Body:    ${html}`);
  console.log('═══════════════════════════════════════════');

  return { messageId: `dev-stub-${Date.now()}` };
};

/**
 * Send email verification link.
 */
const sendVerificationEmail = async (email, token) => {
  const verifyUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email?token=${token}`;
  return sendEmail({
    to: email,
    subject: 'HABS — Verify your email',
    html: `
      <h2>Welcome to HABS!</h2>
      <p>Please verify your email by clicking the link below:</p>
      <a href="${verifyUrl}">${verifyUrl}</a>
      <p>This link expires in 24 hours.</p>
    `,
  });
};

/**
 * Send OTP for password reset.
 */
const sendOtpEmail = async (email, otp) => {
  return sendEmail({
    to: email,
    subject: 'HABS — Password Reset OTP',
    html: `
      <h2>Password Reset</h2>
      <p>Your OTP is: <strong>${otp}</strong></p>
      <p>This OTP expires in 10 minutes.</p>
    `,
  });
};

module.exports = { sendEmail, sendVerificationEmail, sendOtpEmail };
