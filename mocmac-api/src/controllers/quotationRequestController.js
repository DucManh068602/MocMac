import crypto from 'crypto';
import { QuotationRequest } from '../models/QuotationRequest.js';
import { Coupon } from '../models/Coupon.js';
import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';
import { io, userSocketMap } from '../index.js';
import { logAction, getRequestInfo } from '../utils/auditLog.js';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@mocmac.admin.vn';
const MAIL_HOST = process.env.MAIL_HOST || '';
const MAIL_PORT = Number(process.env.MAIL_PORT) || 587;
const MAIL_USER = process.env.MAIL_USER || '';
const MAIL_PASS = process.env.MAIL_PASS || '';
const MAIL_FROM = process.env.MAIL_FROM || 'Mộc Mạc <no-reply@mocmac.vn>';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4200';
const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3000}`;

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
  return transporter.sendMail({ from: MAIL_FROM, to, subject, html });
}

function money(n) { return Number(n || 0).toLocaleString('vi-VN') + 'đ'; }

function statusLabel(s) {
  return { new: 'Mới', processing: 'Đang xử lý', quoted: 'Đã báo giá', accepted: 'Khách đã đồng ý', done: 'Hoàn tất' }[s] || s;
}
function paymentStatusLabel(s) {
  return { pending: 'Chưa thanh toán', paid: 'Đã thanh toán', failed: 'Thanh toán thất bại', refunded: 'Đã hoàn tiền' }[s] || s || 'Chưa thanh toán';
}
function paymentMethodLabel(s) {
  return { cod: 'COD (thu hộ khi giao)', bank_transfer: 'Chuyển khoản ngân hàng', '': 'Chưa chọn' }[s] || s || 'Chưa chọn';
}

function itemsHtml(items) {
  if (!items?.length) return '<p>Không có sản phẩm.</p>';
  const rows = items.map((it) => `
      <tr>
        <td style="padding:8px 10px;border-bottom:1px solid #f0f2ee">${it.name}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #f0f2ee;text-align:center">${it.quantity}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #f0f2ee;text-align:right">${money(it.price)}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #f0f2ee;text-align:right">${money((it.price || 0) * it.quantity)}</td>
      </tr>`).join('');
  return `<table style="width:100%;border-collapse:collapse;font-family:sans-serif"><thead><tr style="background:#f4f1ea">
    <th style="text-align:left;padding:10px;font-size:12px;color:#6b6a5c">Sản phẩm</th>
    <th style="text-align:center;padding:10px;font-size:12px;color:#6b6a5c">SL</th>
    <th style="text-align:right;padding:10px;font-size:12px;color:#6b6a5c">Đơn giá</th>
    <th style="text-align:right;padding:10px;font-size:12px;color:#6b6a5c">Thành tiền</th>
  </tr></thead><tbody>${rows}</tbody></table>`;
}

function mailWrapper(title, body, accent = '#a25633') {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${title}</title></head>
  <body style="margin:0;padding:0;font-family:'Segoe UI',system-ui,sans-serif;background:#faf7f1;color:#2b2a22">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;padding:30px 16px">
      <tr><td align="center" style="padding:0 0 24px 0"><div style="display:inline-block;padding:16px 24px;border-radius:14px;background:${accent};color:#fff"><div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;opacity:.9">Mộc Mạc</div><div style="font-family:Georgia,serif;font-size:20px;font-style:italic;font-weight:600;margin-top:4px">Gửi tặng tâm ý</div></div></td></tr>
      <tr><td style="background:#fff;border-radius:16px;padding:32px;box-shadow:0 4px 16px rgba(0,0,0,.04)">${body}</td></tr>
      <tr><td align="center" style="padding:20px 0 0 0;color:#8a8e87;font-size:11px;line-height:1.5">Mộc Mạc · Sản phẩm thủ công từ làng nghề Việt Nam</td></tr>
    </table></body></html>`;
}

function resultPage(title, message, accent = '#2e7d32') {
  return `<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
  <body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;font-family:'Segoe UI',system-ui,sans-serif;background:#faf7f1;color:#2b2a22">
    <main style="width:100%;max-width:560px;background:#fff;border-radius:18px;padding:32px;box-shadow:0 8px 30px rgba(0,0,0,.08);text-align:center">
      <div style="width:64px;height:64px;margin:0 auto 16px;border-radius:50%;background:${accent};color:#fff;display:flex;align-items:center;justify-content:center;font-size:30px">✓</div>
      <h1 style="margin:0 0 10px;font-size:24px;color:#1e3a2a">${title}</h1>
      <p style="margin:0;line-height:1.7;color:#555">${message}</p>
      <p style="margin:20px 0 0"><a href="${FRONTEND_URL}" style="color:#a25633;font-weight:600">Về Mộc Mạc</a></p>
    </main></body></html>`;
}

function couponUsable(c) {
  if (!c || !c.active) return false;
  if (new Date(c.expiryDate) < new Date()) return false;
  if (c.usageLimit > 0 && c.usedCount >= c.usageLimit) return false;
  return true;
}
function computeDiscount(coupon, baseTotal) {
  if (!coupon) return 0;
  let discount = coupon.discountType === 'percent'
    ? Math.round((Number(baseTotal || 0) * Number(coupon.discountValue || 0)) / 100)
    : Number(coupon.discountValue || 0);
  if (coupon.discountType === 'percent' && Number(coupon.maxDiscount || 0) > 0) discount = Math.min(discount, Number(coupon.maxDiscount));
  return Math.max(0, Math.min(discount, Number(baseTotal || 0)));
}
function couponLabel(c) {
  if (!c?.code) return '';
  return c.discountType === 'percent' ? `${c.discountValue}%` : money(c.discountValue);
}
function ensureAcceptToken(doc) {
  if (!doc.acceptToken) doc.acceptToken = crypto.randomBytes(24).toString('hex');
  return doc.acceptToken;
}

async function notifyCustomerByEmail(email, { title, content, type = 'system', link = '/thong-bao' }) {
  if (!email) return;
  const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('_id email').lean();
  if (!user?._id) return;
  await Notification.create({ title, content, type, recipient: user._id, link, sent: true, sentAt: new Date() });
  const socketId = userSocketMap.get(String(user._id));
  if (socketId) io.to(socketId).emit('notification', { title, content, type, link, createdAt: new Date() });
}

async function sendQuoteUpdatedMail(doc) {
  if (!doc.email) return { skipped: true };
  const token = ensureAcceptToken(doc);
  const acceptUrl = `${BACKEND_URL}/api/quotation-requests/${doc._id}/accept?token=${token}`;
  const hasCoupon = !!doc.appliedCoupon?.code;
  const code = doc._id.toString().slice(-6).toUpperCase();
  const quoted = Number(doc.quotedTotal || doc.totalEstimate || 0);
  const body = `
    <h2 style="color:#1e3a2a;font-family:Georgia,serif;margin:0 0 12px">Báo giá mới cho yêu cầu của bạn</h2>
    <p style="margin:0 0 16px;line-height:1.7">Chào ${doc.name}, Mộc Mạc đã cập nhật báo giá cho yêu cầu quà tặng${hasCoupon ? ' và áp dụng ưu đãi mã giảm giá từ shop' : ''}.</p>
    <div style="background:#f4f1ea;border-radius:10px;padding:14px 16px;margin-bottom:18px"><span style="font-size:12px;color:#6b6a5c">Mã yêu cầu</span><div style="font-size:14px;font-weight:800;color:#2b2a22;margin-top:4px">${code}</div></div>
    ${itemsHtml(doc.items)}
    <div style="border:1px solid #eadfcd;border-radius:10px;padding:16px;margin-top:18px">
      <table style="width:100%;border-collapse:collapse"><tbody>
        <tr><td style="padding:4px 0;color:#6b6a5c">Tạm tính</td><td style="padding:4px 0;text-align:right;font-weight:600">${money(doc.totalEstimate)}</td></tr>
        ${hasCoupon ? `<tr><td style="padding:4px 0;color:#2e7d32">Mã giảm giá ${doc.appliedCoupon.code} (${couponLabel(doc.appliedCoupon)})</td><td style="padding:4px 0;text-align:right;font-weight:700;color:#2e7d32">- ${money(doc.discountAmount)}</td></tr>${doc.appliedCoupon.description ? `<tr><td colspan="2" style="padding:2px 0 6px;font-size:12px;color:#6b6a5c">${doc.appliedCoupon.description}</td></tr>` : ''}` : ''}
        <tr><td style="padding:10px 0 0;border-top:1px solid #eadfcd;font-size:15px;font-weight:700;color:#1e3a2a">Giá báo mới</td><td style="padding:10px 0 0;border-top:1px solid #eadfcd;text-align:right;font-size:18px;font-weight:800;color:#1e3a2a">${money(quoted)}</td></tr>
      </tbody></table>
    </div>
    <p style="margin:18px 0 8px;line-height:1.7">Nếu bạn đồng ý với báo giá này, vui lòng bấm nút bên dưới. Sau khi bạn đồng ý, nhân viên Mộc Mạc sẽ chuẩn bị gói quà và giao tới bạn. Thanh toán có thể thực hiện bằng <strong>COD (thu hộ khi giao)</strong> hoặc <strong>chuyển khoản ngân hàng</strong> theo hướng dẫn của Mộc Mạc.</p>
    <p style="margin:0 0 14px;text-align:center"><a href="${acceptUrl}" style="display:inline-block;padding:13px 22px;border-radius:10px;background:#2e7d32;color:#fff;text-decoration:none;font-weight:700;font-size:15px">Đồng ý báo giá</a></p>
    <p style="margin:0;font-size:12px;color:#8a8e87;word-break:break-all">Nếu nút không bấm được, mở link: ${acceptUrl}</p>`;
  await doc.save();
  return sendMail({ to: doc.email, subject: `Mộc Mạc: Báo giá mới ${code}${hasCoupon ? ` - áp mã ${doc.appliedCoupon.code}` : ''}`, html: mailWrapper('Báo giá mới', body, '#2e7d32') });
}

async function sendStatusMail(doc, status) {
  if (!doc.email) return;
  const label = statusLabel(status);
  const body = `<h2 style="color:#1e3a2a;font-family:Georgia,serif;margin:0 0 12px">Chào ${doc.name}</h2>
    <p style="margin:0 0 16px;line-height:1.7">Yêu cầu báo giá quà tặng của bạn đã được cập nhật: <strong>${label}</strong>.</p>
    <div style="background:#f4f1ea;border-radius:10px;padding:14px 16px;margin-bottom:12px">Mã yêu cầu: <strong>${doc._id.toString().slice(-6).toUpperCase()}</strong></div>
    <div style="font-size:13px;line-height:1.7">Thanh toán: <strong>${paymentStatusLabel(doc.paymentStatus)}</strong>${doc.paymentMethod ? ` · ${paymentMethodLabel(doc.paymentMethod)}` : ''}.</div>
    ${status === 'accepted' ? '<p style="margin:12px 0 0;line-height:1.7">Nhân viên Mộc Mạc sẽ chuẩn bị gói quà và giao tới bạn. Thanh toán COD hoặc chuyển khoản ngân hàng theo hướng dẫn.</p>' : ''}`;
  await sendMail({ to: doc.email, subject: `Mộc Mạc: ${label} - yêu cầu báo giá`, html: mailWrapper(label, body) });
}

async function notifyAdminAccepted(doc) {
  const body = `<h2 style="color:#1e3a2a;font-family:Georgia,serif;margin:0 0 12px">Khách đã đồng ý báo giá</h2>
    <table style="width:100%;font-size:13px;border-collapse:collapse"><tbody>
      <tr><td style="padding:4px 0;color:#6b6a5c;width:34%">Khách hàng</td><td>${doc.name}</td></tr>
      <tr><td style="padding:4px 0;color:#6b6a5c">SĐT</td><td>${doc.phone}</td></tr>
      <tr><td style="padding:4px 0;color:#6b6a5c">Email</td><td>${doc.email || '—'}</td></tr>
      <tr><td style="padding:4px 0;color:#6b6a5c">Mã yêu cầu</td><td><strong>${doc._id.toString().slice(-6).toUpperCase()}</strong></td></tr>
      <tr><td style="padding:4px 0;color:#6b6a5c">Mã giảm giá</td><td>${doc.appliedCoupon?.code || '—'}</td></tr>
      <tr><td style="padding:4px 0;color:#6b6a5c">Giá sau ưu đãi</td><td><strong>${money(doc.quotedTotal || doc.totalEstimate)}</strong></td></tr>
      <tr><td style="padding:4px 0;color:#6b6a5c">Thanh toán</td><td>${paymentStatusLabel(doc.paymentStatus)}${doc.paymentMethod ? ` · ${paymentMethodLabel(doc.paymentMethod)}` : ''}</td></tr>
    </tbody></table>
    <p style="margin-top:16px;font-size:12px">Nhân viên có thể chuẩn bị gói quà và giao tới khách (COD/chuyển khoản). Xem: <a href="${FRONTEND_URL}/admin/quotation-requests" style="color:#a25633">Trang quản trị Mộc Mạc</a></p>`;
  await sendMail({ to: ADMIN_EMAIL, subject: `[Mộc Mạc] Khách ${doc.name} đã đồng ý báo giá`, html: mailWrapper('Khách đã đồng ý', body, '#2e7d32') });
}

export const createQuotationRequest = async (req, res) => {
  try {
    const { name, phone, email, company, address, occasion, items, totalEstimate, preferredSlot, message } = req.body || {};
    if (!name || !phone) return res.status(400).json({ message: 'Vui lòng nhập họ tên và số điện thoại.' });
    if (!items || !items.length) return res.status(400).json({ message: 'Vui lòng chọn ít nhất 1 gói quà.' });
    const total = Number(totalEstimate) || 0;
    const doc = await QuotationRequest.create({
      name, phone, email: email || '', company: company || '', address: address || '', occasion: occasion || '',
      user: req.user?.id || null,
      items: items.map((it) => ({ productId: it.productId || null, name: it.name, quantity: Number(it.quantity) || 1, price: Number(it.price) || 0 })),
      totalEstimate: total, quotedTotal: total, preferredSlot: preferredSlot || '', message: message || '', status: 'new', paymentStatus: 'pending',
    });
    if (doc.email) {
      try {
        const body = `<h2 style="color:#1e3a2a;font-family:Georgia,serif;margin:0 0 12px">Cảm ơn bạn, ${doc.name}</h2>
          <p style="margin:0 0 16px;line-height:1.7">Mộc Mạc đã nhận yêu cầu báo giá quà tặng của bạn. Sau khi bạn đồng ý báo giá, nhân viên sẽ chuẩn bị gói quà và giao tới. Thanh toán có thể COD hoặc chuyển khoản ngân hàng.</p>
          ${itemsHtml(doc.items)}
          <div style="background:#fdf7f1;border-radius:10px;padding:16px;margin-top:18px"><span style="font-size:12px;color:#6b6a5c">Tổng ước tính</span><div style="font-size:18px;font-weight:800;color:#1e3a2a;margin-top:4px">${money(total)}</div></div>`;
        await sendMail({ to: doc.email, subject: 'Mộc Mạc đã nhận yêu cầu báo giá quà tặng', html: mailWrapper('Xác nhận yêu cầu báo giá', body) });
      } catch (e) { console.error('Customer confirmation mail error:', e.message || e); }
    }
    try {
      const body = `<h2 style="color:#1e3a2a;font-family:Georgia,serif;margin:0 0 12px">Yêu cầu báo giá mới</h2>
        <p><strong>${doc.name}</strong> · ${doc.phone} · ${doc.email || '—'}</p>${itemsHtml(doc.items)}
        <p style="margin-top:16px;font-size:12px"><a href="${FRONTEND_URL}/admin/quotation-requests" style="color:#a25633">Xem và xử lý tại trang quản trị</a></p>`;
      await sendMail({ to: ADMIN_EMAIL, subject: `[Mộc Mạc] Yêu cầu báo giá mới từ ${doc.name}`, html: mailWrapper('Yêu cầu báo giá mới', body, '#c75e2d') });
    } catch (e) { console.error('Admin notification mail error:', e.message || e); }
    res.status(201).json({ success: true, message: 'Đã gửi yêu cầu báo giá thành công. Chúng tôi sẽ liên hệ lại trong khung giờ bạn chọn.', id: doc._id });
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
    const { status, paymentStatus, paymentMethod, paymentNote, couponCode, clearCoupon, sendQuoteMail } = req.body || {};
    const validStatuses = ['new', 'processing', 'quoted', 'accepted', 'done'];
    const validPayments = ['pending', 'paid', 'failed', 'refunded'];
    const validMethods = ['', 'cod', 'bank_transfer'];
    if (status && !validStatuses.includes(status)) return res.status(400).json({ message: 'Trạng thái không hợp lệ.' });
    if (paymentStatus && !validPayments.includes(paymentStatus)) return res.status(400).json({ message: 'Trạng thái thanh toán không hợp lệ.' });
    if (paymentMethod !== undefined && !validMethods.includes(String(paymentMethod || ''))) return res.status(400).json({ message: 'Phương thức thanh toán không hợp lệ.' });

    const existing = await QuotationRequest.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Không tìm thấy yêu cầu báo giá.' });

    const prevStatus = existing.status;
    const prevPayment = existing.paymentStatus || 'pending';
    const prevCoupon = existing.appliedCoupon?.code || '';
    const base = Number(existing.totalEstimate || 0);
    let couponChanged = false;

    if (clearCoupon) {
      existing.appliedCoupon = { code: '', description: '', discountType: '', discountValue: 0, maxDiscount: 0 };
      existing.discountAmount = 0;
      existing.quotedTotal = base;
      existing.acceptedAt = null;
      if (prevPayment === 'paid') existing.paymentStatus = 'pending';
      couponChanged = !!prevCoupon;
    } else if (couponCode !== undefined) {
      const code = String(couponCode || '').trim().toUpperCase();
      if (!code) {
        existing.appliedCoupon = { code: '', description: '', discountType: '', discountValue: 0, maxDiscount: 0 };
        existing.discountAmount = 0;
        existing.quotedTotal = base;
        couponChanged = !!prevCoupon;
      } else {
        const coupon = await Coupon.findOne({ code }).lean();
        if (!coupon) return res.status(404).json({ message: `Không tìm thấy mã giảm giá ${code}.` });
        if (!couponUsable(coupon)) return res.status(400).json({ message: `Mã ${code} không còn hiệu lực.` });
        if (Number(coupon.minOrderValue || 0) > 0 && base < Number(coupon.minOrderValue)) {
          return res.status(400).json({ message: `Mã ${code} yêu cầu giá trị tối thiểu ${money(coupon.minOrderValue)}.` });
        }
        existing.appliedCoupon = {
          code: coupon.code, description: coupon.description || '', discountType: coupon.discountType,
          discountValue: Number(coupon.discountValue || 0), maxDiscount: Number(coupon.maxDiscount || 0),
        };
        existing.discountAmount = computeDiscount(coupon, base);
        existing.quotedTotal = Math.max(0, base - existing.discountAmount);
        couponChanged = prevCoupon !== coupon.code || existing.discountAmount !== Number(existing.discountAmount);
      }
      if (couponChanged) {
        existing.acceptedAt = null;
        if (prevPayment === 'paid') existing.paymentStatus = 'pending';
      }
    } else if (!Number(existing.quotedTotal) && base) {
      existing.quotedTotal = base;
    }

    if (paymentMethod !== undefined) existing.paymentMethod = String(paymentMethod || '');
    if (paymentNote !== undefined) existing.paymentNote = String(paymentNote || '').trim();
    if (paymentStatus) {
      existing.paymentStatus = paymentStatus;
      if (paymentStatus === 'paid') existing.paidAt = new Date();
      if (paymentStatus !== 'paid' && paymentStatus !== 'refunded') existing.paidAt = null;
    }

    if (couponChanged) {
      ensureAcceptToken(existing);
      existing.quotedAt = new Date();
      if (existing.status === 'new' || existing.status === 'accepted') existing.status = 'quoted';
    }
    if (status) {
      existing.status = status;
      if (status === 'accepted') existing.acceptedAt = existing.acceptedAt || new Date();
    }
    if (status === 'quoted' && !existing.quotedAt) existing.quotedAt = new Date();

    await existing.save();
    const statusChanged = !!status && status !== prevStatus;
    const paymentChanged = !!paymentStatus && paymentStatus !== prevPayment;
    const { user, ip } = getRequestInfo(req);
    await logAction({ action: couponChanged ? 'quotation.update_quote' : paymentChanged ? 'quotation.update_payment' : (statusChanged ? 'quotation.update_status' : 'quotation.update'), resourceType: 'QuotationRequest', resourceId: existing._id, user, ip, details: { code: existing._id.toString().slice(-6).toUpperCase(), status: existing.status, paymentStatus: existing.paymentStatus, paymentMethod: existing.paymentMethod, coupon: existing.appliedCoupon?.code || '', quotedTotal: existing.quotedTotal, discountAmount: existing.discountAmount, customer: existing.name } });

    if ((statusChanged || paymentChanged) && existing.email) {
      try {
        await notifyCustomerByEmail(existing.email, {
          title: `Báo giá quà tặng ${existing._id.toString().slice(-6).toUpperCase()}: ${paymentChanged ? paymentStatusLabel(existing.paymentStatus) : statusLabel(existing.status)}`,
          content: `Yêu cầu báo giá quà tặng của bạn đã cập nhật. Trạng thái: ${statusLabel(existing.status)}. Thanh toán: ${paymentStatusLabel(existing.paymentStatus)}${existing.paymentMethod ? ` (${paymentMethodLabel(existing.paymentMethod)})` : ''}. Giá báo: ${money(existing.quotedTotal || existing.totalEstimate)}.`,
          type: 'system',
          link: '/thong-bao',
        });
      } catch (e) { console.error('Quotation customer notification error:', e.message || e); }
    }

    const doc = existing.toObject();
    let mailSent = false, mailType = '';
    if ((couponChanged || sendQuoteMail) && doc.email) {
      try { await sendQuoteUpdatedMail(existing); mailSent = true; mailType = 'quote'; doc.acceptToken = existing.acceptToken; }
      catch (e) { console.error('Quote updated mail error:', e.message || e); }
    } else if ((statusChanged || paymentChanged) && (status === 'quoted' || status === 'done' || status === 'accepted' || paymentChanged) && doc.email) {
      try { await sendStatusMail(doc, statusChanged ? status : doc.status); mailSent = true; mailType = 'status'; }
      catch (e) { console.error('Status mail error:', e.message || e); }
    }

    res.json({ request: doc, mailSent, mailType, couponChanged, message: mailSent ? 'Đã cập nhật và gửi email cho khách.' : 'Đã cập nhật yêu cầu báo giá.' });
  } catch (e) {
    console.error('Update quotation request error:', e);
    res.status(500).json({ message: e?.message || 'Không thể cập nhật yêu cầu báo giá.' });
  }
};

export const acceptQuotationRequest = async (req, res) => {
  try {
    const { token } = req.query || {};
    const doc = await QuotationRequest.findById(req.params.id);
    if (!doc || !doc.acceptToken || String(token || '') !== String(doc.acceptToken)) {
      return res.status(400).send(resultPage('Liên kết không hợp lệ', 'Link đồng ý báo giá không đúng hoặc đã thay đổi. Vui lòng liên hệ Mộc Mạc để được hỗ trợ.', '#b42318'));
    }
    if (doc.status === 'accepted') {
      return res.send(resultPage('Bạn đã đồng ý báo giá', `Yêu cầu ${doc._id.toString().slice(-6).toUpperCase()} đã được xác nhận. Nhân viên Mộc Mạc sẽ chuẩn bị gói quà và giao tới bạn. Thanh toán COD hoặc chuyển khoản ngân hàng.`));
    }
    if (doc.status === 'done') {
      return res.send(resultPage('Yêu cầu đã hoàn tất', `Yêu cầu ${doc._id.toString().slice(-6).toUpperCase()} đã hoàn tất. Cảm ơn bạn.`));
    }
    doc.status = 'accepted';
    doc.acceptedAt = new Date();
    if (!doc.couponUsageCounted && doc.appliedCoupon?.code) {
      const coupon = await Coupon.findOne({ code: String(doc.appliedCoupon.code).toUpperCase() });
      if (coupon) {
        const canCount = coupon.active && !(coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) && new Date(coupon.expiryDate) >= new Date();
        if (canCount) {
          await Coupon.updateOne({ _id: coupon._id }, { $inc: { usedCount: 1 } });
          doc.couponUsageCounted = true;
        }
      }
    }
    await doc.save();
    await logAction({ action: 'quotation.accept', resourceType: 'QuotationRequest', resourceId: doc._id, details: { code: doc._id.toString().slice(-6).toUpperCase(), customer: doc.name, email: doc.email, coupon: doc.appliedCoupon?.code || '', quotedTotal: doc.quotedTotal, paymentStatus: doc.paymentStatus, couponUsageCounted: !!doc.couponUsageCounted } });
    try {
      await notifyCustomerByEmail(doc.email, {
        title: `Đã xác nhận báo giá ${doc._id.toString().slice(-6).toUpperCase()}`,
        content: `Bạn đã đồng ý báo giá quà tặng. Nhân viên Mộc Mạc sẽ chuẩn bị gói quà và giao tới bạn. Thanh toán: ${paymentStatusLabel(doc.paymentStatus)}${doc.paymentMethod ? ` (${paymentMethodLabel(doc.paymentMethod)})` : ''} (COD hoặc chuyển khoản ngân hàng).`,
        type: 'system',
        link: '/thong-bao',
      });
    } catch (e) { console.error('Customer accepted notification error:', e.message || e); }
    try { await notifyAdminAccepted(doc.toObject()); } catch (e) { console.error('Admin accepted mail error:', e.message || e); }
    return res.send(resultPage('Đã xác nhận đồng ý báo giá', `Cảm ơn ${doc.name}. Mộc Mạc đã nhận xác nhận của bạn cho yêu cầu ${doc._id.toString().slice(-6).toUpperCase()}. Nhân viên sẽ chuẩn bị gói quà và giao tới bạn. Bạn có thể thanh toán bằng COD (thu hộ khi giao) hoặc chuyển khoản ngân hàng theo hướng dẫn của Mộc Mạc.`));
  } catch (e) {
    console.error('Accept quotation request error:', e);
    return res.status(500).send(resultPage('Không thể xác nhận', 'Đã có lỗi khi xác nhận báo giá. Vui lòng thử lại hoặc liên hệ Mộc Mạc.', '#b42318'));
  }
};

export const listMyQuotationRequests = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const email = String(req.user?.email || '').toLowerCase().trim();
    const filter = userId ? { user: userId } : (email ? { email } : {});
    const requests = await QuotationRequest.find(filter).sort({ createdAt: -1 }).limit(50).lean();
    return res.json({ success: true, requests });
  } catch (e) {
    console.error('List my quotation requests error:', e);
    return res.status(500).json({ success: false, message: 'Không thể tải quà tặng đã mua/báo giá.', requests: [] });
  }
};
