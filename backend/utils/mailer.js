import nodemailer from 'nodemailer';

let transporter;

const getTransporter = () => {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined;
  const secure = process.env.SMTP_SECURE === 'true';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

  if (host && port && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });
  }
  // Fallback: Gmail service using app password
  else if (gmailUser && gmailAppPassword) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    });
  }
  return transporter;
};

export async function sendMail(to, subject, text, html) {
  const mailTransporter = getTransporter();
  // Resolve fromAddress dynamically to ensure env vars are loaded
  const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER || process.env.GMAIL_USER;

  if (!mailTransporter || !fromEmail || !to) {
    return { success: false, error: 'Mailer not configured' };
  }
  try {
    await mailTransporter.sendMail({
      from: fromEmail,
      to,
      subject,
      text,
      html,
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: err?.message || 'Send error' };
  }
}

export async function sendOTPEmail(to, otp) {
  const subject = 'Your Verification OTP';
  const text = `Your OTP for verification is ${otp}. It will expire in 5 minutes.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
      <h2 style="color: #333; text-align: center;">Verification OTP</h2>
      <p style="color: #555; text-align: center;">Your One-Time Password (OTP) for verification is:</p>
      <div style="background-color: #f4f4f4; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
        <h1 style="color: #4CAF50; letter-spacing: 5px; margin: 0;">${otp}</h1>
      </div>
      <p style="color: #555; text-align: center; font-size: 14px;">This OTP will expire in 5 minutes. Do not share this code with anyone.</p>
    </div>
  `;
  return sendMail(to, subject, text, html);
}
