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

function otpEmailTemplate({ title, subtitle, otp, actionText, actionUrl }) {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Arial,Helvetica,sans-serif;background:#fbf9f2;color:#2f4538;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 12px 40px rgba(47,69,56,0.10);border:1px solid #e8dfcb;">
    <!-- Header -->
    <tr>
      <td align="center" style="padding:32px 24px 24px;background:linear-gradient(135deg,#2f4538 0%,#4a7c59 100%);">
        <table cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="font-size:28px;font-weight:800;color:#fff;letter-spacing:2px;">MỘC MẠC</td>
          </tr>
          <tr>
            <td style="font-size:12px;color:#e8dfcb;margin-top:4px;letter-spacing:.5px;">Đặc sản &amp; Làng Nghệ Việt</td>
          </tr>
        </table>
      </td>
    </tr>
    <!-- Body -->
    <tr>
      <td style="padding:32px 24px;text-align:center;">
        <h1 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#2f4538;">${title}</h1>
        <p style="margin:0 0 24px;font-size:14px;color:#7a7f73;line-height:1.6;">${subtitle}</p>
        <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
          <tr>
            <td style="padding:18px 28px;background:#f3efe3;border:1px solid #ddd5c2;border-radius:12px;">
              <span style="display:inline-block;font-size:32px;font-weight:900;color:#c0392b;letter-spacing:8px;font-family:'Courier New',monospace;">${otp}</span>
            </td>
          </tr>
        </table>
        <p style="margin:16px 0 0;font-size:13px;color:#7a7f73;">Mã có hiệu lực trong <strong>10 phút</strong>. Vui lòng không chia sẻ mã này với bất kỳ ai.</p>
        ${actionUrl ? `<p style="margin:24px 0 0;"><a href="${actionUrl}" style="display:inline-block;padding:12px 24px;background:#c0392b;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;">${actionText || 'Kích hoạt ngay'}</a></p>` : ''}
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td align="center" style="padding:24px;background:#f3efe3;border-top:1px solid #e8dfcb;">
        <p style="margin:0;font-size:11px;color:#7a7f73;">© ${new Date().getFullYear()} Mộc Mạc — Đặc sản &amp; Làng Nghệ Việt.<br>Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendMail({ to, subject, text, html }) {
  const finalHtml = html || text;
  if (!transporter) {
    console.warn('[Mailer] Chưa cấu hình SMTP (MAIL_HOST). Email sẽ không được gửi.');
    console.log('[Mailer][dev]', { to, subject, html: finalHtml });
    return { dev: true, messageId: 'dev' };
  }
  const info = await transporter.sendMail({ from, to, subject, text, html: finalHtml });
  return info;
}

export { otpEmailTemplate };

export default sendMail;
