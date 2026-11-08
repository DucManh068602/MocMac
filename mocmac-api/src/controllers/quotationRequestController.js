import { QuotationRequest } from '../models/QuotationRequest.js';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@mocmac.admin.vn';
const MAIL_HOST = process.env.MAIL_HOST || '';
const MAIL_PORT = Number(process.env.MAIL_PORT) || 587;
const MAIL_USER = process.env.MAIL_USER || '';
const MAIL_PASS = process.env.MAIL_PASS || '';
const MAIL_FROM = process.env.MAIL_FROM || 'Moc Mac <no-reply@mocmac.vn>';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4200';

async function sendMail({ to, subject, html }) {
  if (!MAIL_HOST || !MAIL_USER || !MAIL_PASS) {
    console.log('[MAIL skipped] SMTP not configured. Would send to:', to, subject);
    return { skipped: true };
  }
  const nodemailer = (await import('nodemailer')).default;
  const transporter = nodemailer.createTransport({
    host: MAIL_HOST,
    port: MAIL_PORT,
    secure: process.env.MAIL_SECURE === 'true',
    auth: { user: MAIL_USER, pass: MAIL_PASS },
  });
  return transporter.sendMail({
    from: MAIL_FROM,
    to,
    subject,
    html,
  });
}

function itemsHtml(items) {
  if (!items || !items.length) return '<p>Không có sản phẩm.</p>';
  const rows = items
    .map(
      (it) => `
      <tr>
        <td style="padding:8px 10px;border-bottom:1px solid #f0f2ee">${it.name}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #f0f2ee;text-align:center">${it.quantity}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #f0f2ee;text-align:right">${Number(it.price || 0).toLocaleString('vi-VN')}đ</td>
        <td style="padding:8px 10px;border-bottom:1px solid #f0f2ee;text-align:right">${Number((it.price || 0) * it.quantity).toLocaleString('vi-VN')}đ</td>
      </tr>
    `,
    )
    .join('');
  return `
    <table style="width:100%;border-collapse:collapse;font-family:sans-serif">
      <thead>
        <tr style="background:#f4f1ea">
          <th style="text-align:left;padding:10px;font-size:12px;color:#6b6a5c">Sản phẩm</th>
          <th style="text-align:center;padding:10px;font-size:12px;color:#6b6a5c">Số lượng</th>
          <th style="text-align:right;padding:10px;font-size:12px;color:#6b6a5c">Đơn giá</th>
          <th style="text-align:right;padding:10px;font-size:12px;color:#6b6a5c">Thành tiền</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function mailWrapper(title, body, accent = '#a25633') {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="margin:0;padding:0;font-family:'Segoe UI',system-ui,sans-serif;background:#faf7f1;color:#2b2a22">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;padding:30px 16px">
        <tr>
          <td align="center" style="padding:0 0 24px 0">
            <div style="display:inline-block;padding:16px 24px;border-radius:14px;background:${accent};color:#fff;box-shadow:0 8px 24px rgba(162,86,51,.25)">
              <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;opacity:.9">Mộc Mạc</div>
              <div style="font-family:'Playfair Display',Georgia,serif;font-size:20px;font-style:italic;font-weight:600;margin-top:4px">Gửi tặng tâm ý</div>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background:#fff;border-radius:16px;padding:32px;box-shadow:0 4px 16px rgba(0,0,0,.04)">
            ${body}
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:20px 0 0 0;color:#8a8e87;font-size:11px;line-height:1.5">
            Mộc Mạc · Sản phẩm thủ công từ làng nghề Việt Nam<br />
            Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

export const createQuotationRequest = async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      company,
      address,
      occasion,
      items,
      totalEstimate,
      preferredSlot,
      message,
    } = req.body || {};

    if (!name || !phone) {
      return res.status(400).json({ message: 'Vui lòng nhập họ tên và số điện thoại.' });
    }
    if (!items || !items.length) {
      return res.status(400).json({ message: 'Vui lòng chọn ít nhất 1 gói quà.' });
    }

    const doc = await QuotationRequest.create({
      name,
      phone,
      email: email || '',
      company: company || '',
      address: address || '',
      occasion: occasion || '',
      items: items.map((it) => ({
        productId: it.productId || null,
        name: it.name,
        quantity: Number(it.quantity) || 1,
        price: Number(it.price) || 0,
      })),
      totalEstimate: Number(totalEstimate) || 0,
      preferredSlot: preferredSlot || '',
      message: message || '',
      status: 'new',
    });

    const total = doc.totalEstimate;

    // 1. Gửi email xác nhận cho KHÁCH HÀNG (nếu có email)
    if (doc.email) {
      try {
        const customerHtml = mailWrapper('Xác nhận yêu cầu báo giá', `
            <h2 style="color:#1e3a2a;font-family:'Playfair Display',Georgia,serif;margin:0 0 12px">Cảm ơn bạn, ${doc.name}</h2>
            <p style="margin:0 0 16px;line-height:1.7">Chúng tôi đã nhận yêu cầu báo giá quà tặng của bạn. Đội ngũ Mộc Mạc sẽ kiểm tra và liên hệ lại với bạn trong khung giờ <strong>${doc.preferredSlot || 'sớm nhất có thể'}</strong>.</p>
            <table style="width:100%;margin:18px 0;border:1px solid #f0f2ee;border-radius:10px;overflow:hidden">
              <thead>
                <tr style="background:#f4f1ea">
                  <th style="text-align:left;padding:12px 14px;font-size:12px;color:#6b6a5c">Sản phẩm đã chọn</th>
                  <th style="text-align:center;padding:12px;font-size:12px;color:#6b6a5c">SL</th>
                  <th style="text-align:right;padding:12px;font-size:12px;color:#6b6a5c">Tổng</th>
                </tr>
              </thead>
              <tbody>${itemsHtml(doc.items).replace('<table style="width:100%;border-collapse:collapse;font-family:sans-serif">','').replace('</table>','')}</tbody>
            </table>
            <div style="background:#fdf7f1;border-radius:10px;padding:16px;margin-top:18px">
              <p style="margin:0 0 6px;font-size:12px;color:#6b6a5c">Tổng ước tính</p>
              <p style="margin:0;font-size:18px;font-weight:800;color:#1e3a2a">${total.toLocaleString('vi-VN')}đ</p>
            </div>
            ${doc.message ? `<div style="margin-top:16px;padding:14px;border-left:3px solid #a25633;background:#faf7f1"><p style="margin:0;font-size:12px;color:#2b2a22"><strong>Lời nhắn của bạn:</strong> ${doc.message}</p></div>` : ''}
            <p style="margin-top:22px;font-size:12px;color:#8a8e87">Trạng thái: <span style="color:#a25633;font-weight:700">Đang chờ xác nhận</span> · Mã đơn: <strong>${doc._id.toString().slice(-6).toUpperCase()}</strong></p>
          `, '#a25633');
        await sendMail({
          to: doc.email,
          subject: 'Mộc Mạc đã nhận yêu cầu báo giá quà tặng của bạn',
          html: customerHtml,
        });
      } catch (mailErr) {
        console.error('Customer confirmation mail error:', mailErr.message || mailErr);
      }
    }

    // 2. Gửi email thông báo ADMIN
    try {
      const adminHtml = mailWrapper('Yêu cầu báo giá mới', `
          <h2 style="color:#1e3a2a;font-family:'Playfair Display',Georgia,serif;margin:0 0 12px">Yêu cầu báo giá quà tặng mới</h2>
          <table style="width:100%;margin:16px 0;border-collapse:collapse;font-size:12px">
            <tr><td style="padding:6px 0;color:#6b6a5c;width:30%"><strong>Khách hàng</strong></td><td style="padding:6px 0">${doc.name}</td></tr>
            <tr><td style="padding:6px 0;color:#6b6a5c"><strong>SĐT</strong></td><td style="padding:6px 0">${doc.phone}</td></tr>
            <tr><td style="padding:6px 0;color:#6b6a5c"><strong>Email</strong></td><td style="padding:6px 0">${doc.email || '—'}</td></tr>
            <tr><td style="padding:6px 0;color:#6b6a5c"><strong>Công ty</strong></td><td style="padding:6px 0">${doc.company || '—'}</td></tr>
            <tr><td style="padding:6px 0;color:#6b6a5c"><strong>Dịp tặng</strong></td><td style="padding:6px 0">${doc.occasion || '—'}</td></tr>
            <tr><td style="padding:6px 0;color:#6b6a5c"><strong>Khung giờ</strong></td><td style="padding:6px 0">${doc.preferredSlot || '—'}</td></tr>
            <tr><td style="padding:6px 0;color:#6b6a5c"><strong>Tổng ước tính</strong></td><td style="padding:6px 0"><strong>${total.toLocaleString('vi-VN')}đ</strong></td></tr>
            ${doc.message ? `<tr><td style="padding:6px 0;color:#6b6a5c"><strong>Lời nhắn</strong></td><td style="padding:6px 0">${doc.message}</td></tr>` : ''}
          </table>
          <h3 style="margin:18px 0 8px;font-size:13px;color:#6b6a5c">Danh sách sản phẩm</h3>
          ${itemsHtml(doc.items)}
          <p style="margin-top:16px;font-size:12px;color:#8a8e87">Xem chi tiết và xác nhận tại: <a href="${FRONTEND_URL}/admin/quotation-requests" style="color:#a25633;text-decoration:underline">Trang quản trị Mộc Mạc</a></p>
        `, '#c75e2d');
      await sendMail({
        to: ADMIN_EMAIL,
        subject: `[Mộc Mạc] Yêu cầu báo giá quà tặng mới từ ${doc.name}`,
        html: adminHtml,
      });
    } catch (mailErr) {
      console.error('Admin notification mail error:', mailErr.message || mailErr);
    }

    res.status(201).json({
      success: true,
      message: 'Đã gửi yêu cầu báo giá thành công. Chúng tôi sẽ liên hệ lại trong khung giờ bạn chọn.',
      id: doc._id,
    });
  } catch (e) {
    console.error('Create quotation request error:', e);
    res.status(500).json({ message: 'Không thể gửi yêu cầu báo giá. Vui lòng thử lại.' });
  }
};

export const listQuotationRequests = async (_req, res) => {
  try {
    const requests = await QuotationRequest.find({}).sort({ createdAt: -1 }).lean();
    res.json({ requests });
  } catch (e) {
    console.error('List quotation requests error:', e);
    res.status(500).json({ message: 'Không thể tải danh sách yêu cầu báo giá.' });
  }
};

export const updateQuotationRequest = async (req, res) => {
  try {
    const { status } = req.body || {};
    if (!status || !['new', 'processing', 'quoted', 'done'].includes(status)) {
      return res.status(400).json({ message: 'Trạng thái không hợp lệ.' });
    }
    const existing = await QuotationRequest.findById(req.params.id).lean();
    if (!existing) return res.status(404).json({ message: 'Không tìm thấy yêu cầu báo giá.' });

    const doc = await QuotationRequest.findByIdAndUpdate(req.params.id, { status }, { new: true }).lean();

    // Gửi email cho khách khi admin xác nhận (quoted) hoặc hoàn tất (done)
    if ((status === 'quoted' || status === 'done') && existing.status !== status && doc.email) {
      const statusLabel = status === 'quoted' ? 'Đã xác nhận báo giá' : 'Hoàn tất đơn hàng';
      const statusColor = status === 'quoted' ? '#2e7d32' : '#1e3a2a';
      try {
        const statusHtml = mailWrapper(statusLabel, `
            <h2 style="color:${statusColor};font-family:'Playfair Display',Georgia,serif;margin:0 0 12px">Chào bạn, ${doc.name}</h2>
            <p style="margin:0 0 16px;line-height:1.7">Tin vui! Đơn yêu cầu báo giá quà tặng của bạn đã được <strong style="color:${statusColor}">${statusLabel}</strong> bởi đội ngũ Mộc Mạc.</p>
            <div style="background:#f4f1ea;border-radius:10px;padding:16px;margin-bottom:18px">
              <p style="margin:0 0 6px;font-size:12px;color:#6b6a5c">Mã đơn</p>
              <p style="margin:0;font-size:14px;font-weight:800;color:#2b2a22">${doc._id.toString().slice(-6).toUpperCase()}</p>
            </div>
            ${status === 'quoted' ? `
              <p style="margin:0 0 16px;line-height:1.7;color:#2b2a22">Chúng tôi đã xem xét gói quà bạn chọn. Nhân viên sẽ gọi lại bạn trong khung giờ <strong>${doc.preferredSlot || 'sớm nhất có thể'}</strong> để hoàn tất chi tiết và lịch giao hàng.</p>
            ` : `
              <p style="margin:0 0 16px;line-height:1.7;color:#2b2a22">Gói quà của bạn đã được shop đóng gói và sẵn sàng giao hàng. Nhân viên sẽ liên hệ để hẹn lịch nhận quà.</p>
            `}
            <div style="margin-top:20px;padding-top:16px;border-top:1px solid #f0f2ee">
              <p style="margin:0;font-size:11px;color:#8a8e87">Trang quản trị Mộc Mạc · Cảm ơn bạn đã tin tưởng Mộc Mạc</p>
            </div>
          `, statusColor);
        await sendMail({
          to: doc.email,
          subject: `Mộc Mạc: ${statusLabel} cho đơn hàng của bạn`,
          html: statusHtml,
        });
      } catch (mailErr) {
        console.error('Customer status mail error:', mailErr.message || mailErr);
      }
    }

    res.json({ request: doc });
  } catch (e) {
    console.error('Update quotation request error:', e);
    res.status(500).json({ message: 'Không thể cập nhật yêu cầu báo giá.' });
  }
};
