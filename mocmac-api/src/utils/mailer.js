import nodemailer from 'nodemailer';

const from = process.env.MAIL_FROM || process.env.MAIL_USER || 'no-reply@mocmac.vn';

let transporter = null;
if (process.env.MAIL_HOST) {
  transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT) || 587,
    secure: String(process.env.MAIL_SECURE || 'false') === 'true',
    auth: process.env.MAIL_USER
      ? { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS }
      : undefined,
  });
}

export async function sendMail({ to, subject, text, html }) {
  if (!transporter) {
    console.warn('[Mailer] Chưa cấu hình SMTP (MAIL_HOST). Email sẽ không được gửi.');
    console.log('[Mailer][dev]', { to, subject, text });
    return { dev: true, messageId: 'dev' };
  }
  const info = await transporter.sendMail({ from, to, subject, text, html });
  return info;
}

export default sendMail;
