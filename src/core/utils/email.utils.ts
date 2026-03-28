import nodemailer from 'nodemailer';

// Configure this with real credentials in production
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587'),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendVerificationEmail = async (email: string, token: string): Promise<void> => {
  const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
  
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn(`[Email MOCK] Would have sent verification email to ${email}. Link: ${verifyUrl}`);
    return;
  }

  await transporter.sendMail({
    from: '"Orde-X" <noreply@ordex.com>',
    to: email,
    subject: 'Verify your Orde-X Account',
    html: `
      <h1>Account Verification</h1>
      <p>Thank you for signing up on Orde-X. Please click the link below to verify your account:</p>
      <a href="${verifyUrl}">Verify Account</a>
      <p>This link expires in 24 hours.</p>
    `,
  });
};
