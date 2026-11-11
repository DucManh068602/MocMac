import { Order } from '../models/Order.js';
import { Payment } from '../models/Payment.js';
import { Coupon } from '../models/Coupon.js';
import { Product } from '../models/Product.js';
import { FlashSale } from '../models/FlashSale.js';
import { generateOrderId, initStatusHistory, appendStatusHistory } from '../utils/orderUtils.js';
import { buildVnpayPaymentUrl, verifyVnpayReturn } from '../utils/vnpay.js';
import { membershipForUser } from '../utils/membership.js';

const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:4200').replace(/\s+/g, '').replace(/\/+$/, '');
const FREE_SHIPPING_THRESHOLD = 500000;
const SHIPPING_FEE = 30000;

function computeCouponDiscount(coupon, baseAmount) {
  if (!coupon) return 0;
  let amount = coupon.discountType === 'percent'
    ? Math.round((Number(baseAmount || 0) * Number(coupon.discountValue || 0)) / 100)
    : Number(coupon.discountValue || 0);
  if (coupon.discountType === 'percent' && Number(coupon.maxDiscount || 0) > 0) amount = Math.min(amount, Number(coupon.maxDiscount));
  return Math.max(0, Math.min(amount, Number(baseAmount || 0)));
}

async function resolveCoupon(code, subtotalAfterMember) {
  const normalized = String(code || '').trim().toUpperCase();
  if (!normalized) return { coupon: null, discount: 0 };
  const coupon = await Coupon.findOne({ code: normalized }).lean();
  if (!coupon) throw new Error(`Mã giảm giá ${normalized} không tồn tại.`);
  if (!coupon.active) throw new Error(`Mã giảm giá ${normalized} không còn kích hoạt.`);
  if (coupon.startsAt && new Date(coupon.startsAt) > new Date()) throw new Error(`Mã giảm giá ${normalized} chưa bắt đầu sử dụng.`);
  if (new Date(coupon.expiryDate) < new Date()) throw new Error(`Mã giảm giá ${normalized} đã hết hạn.`);
  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) throw new Error(`Mã giảm giá ${normalized} đã hết lượt sử dụng.`);
  if (Number(coupon.minOrderValue || 0) > 0 && Number(subtotalAfterMember) < Number(coupon.minOrderValue)) {
    throw new Error(`Mã ${normalized} yêu cầu giá trị tối thiểu ${Number(coupon.minOrderValue).toLocaleString('vi-VN')}đ sau ưu đãi thành viên.`);
  }
  return { coupon, discount: computeCouponDiscount(coupon, subtotalAfterMember) };
}

export const createPayment = async (req, res) => {
  try {
    const { items, paymentMethod = 'cod', customerInfo, note = '', couponCodes = [] } = req.body ?? {};

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Đơn hàng phải có ít nhất một sản phẩm.' });
    }

    const codes = Array.isArray(couponCodes) ? couponCodes : [couponCodes];
    const uniqueCodes = [...new Set(codes.map((c) => String(c || '').trim().toUpperCase()).filter(Boolean))];
    if (uniqueCodes.length > 2) {
      return res.status(400).json({ success: false, message: 'Tối đa áp dụng 2 mã giảm giá mỗi đơn hàng.' });
    }

    const productIds = items.map((item) => Number(item.productId)).filter(Number.isFinite);
    const [products, flashSale, membership] = await Promise.all([
      Product.find({ id: { $in: productIds } }).populate('deal').lean(),
      FlashSale.findOne({ key: 'storewide' }).lean(),
      req.user ? membershipForUser(req.user) : Promise.resolve(null),
    ]);
    const productById = new Map(products.map((product) => [product.id, product]));
    const now = new Date();
    const trustedItems = items.map((item) => {
      const product = productById.get(Number(item.productId));
      if (!product) throw new Error('Một sản phẩm trong giỏ không còn tồn tại.');
      const deal = product.deal;
      const isDealActive = deal?.active && new Date(deal.startsAt) <= now && new Date(deal.endsAt) >= now;
      const dealPrice = isDealActive
        ? (deal.discountType === 'percent' ? Math.max(0, Math.round(product.price * (100 - Number(deal.discountValue)) / 100)) : Math.max(0, product.price - Number(deal.discountValue)))
        : product.price;
      const flashSaleLive = flashSale?.active && flashSale?.startsAt && flashSale?.endsAt && new Date(flashSale.startsAt) <= now && new Date(flashSale.endsAt) >= now;
      const flashSalePrice = flashSaleLive ? Math.max(0, Math.round(product.price * (100 - Number(flashSale.discountPercent || 0)) / 100)) : product.price;
      const unitPrice = Math.min(dealPrice, flashSalePrice);
      return { productId: product.id, name: product.name, price: unitPrice, quantity: Math.max(1, Number(item.quantity) || 1) };
    });

    const subtotal = trustedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const memberDiscountPercent = Number(membership?.currentTier?.discountPercent || 0);
    const memberDiscount = Math.round(subtotal * memberDiscountPercent / 100);
    const subtotalAfterMember = Math.max(0, subtotal - memberDiscount);

    // Xác thực nhiều mã (tối đa 2), tổng hợp giảm giá và giảm phí vận chuyển
    const appliedCoupons = [];
    let totalCouponDiscount = 0;
    let totalShippingDiscount = 0;
    for (const code of uniqueCodes) {
      try {
        const { coupon, discount } = await resolveCoupon(code, subtotalAfterMember);
        if (!coupon) continue;
        appliedCoupons.push(coupon);
        totalCouponDiscount += discount || 0;
        if (coupon.freeShipping) totalShippingDiscount = SHIPPING_FEE;
        else if (coupon.shippingDiscount && coupon.shippingDiscount > 0) totalShippingDiscount += coupon.shippingDiscount;
      } catch (e) {
        // Bỏ qua mã không hợp lệ, tiếp tục mã khác
      }
    }

    const discount = Math.min(subtotal, memberDiscount + totalCouponDiscount);
    const baseShipping = subtotal <= 0 ? 0 : SHIPPING_FEE;
    const memberFreeShipping = membership?.currentTier?.freeShipping === true || (Number(membership?.currentTier?.freeShippingThreshold || 0) > 0 && subtotalAfterMember >= Number(membership.currentTier.freeShippingThreshold)) || subtotalAfterMember >= FREE_SHIPPING_THRESHOLD;
    const freeShipping = memberFreeShipping || totalShippingDiscount >= baseShipping;
    const shipping = freeShipping ? 0 : Math.max(0, baseShipping - Math.min(totalShippingDiscount, baseShipping));
    const total = Math.max(0, subtotal - discount + shipping);

    // Tăng usedCount cho từng mã đã áp dụng
    for (const coupon of appliedCoupons) {
      await Coupon.updateOne({ code: coupon.code }, { $inc: { usedCount: 1 } });
    }

    const order = await Order.create({
      user: req.user ? req.user.id : null,
      orderId: generateOrderId(),
      items: trustedItems,
      subtotal,
      discount,
      shipping,
      total,
      paymentMethod,
      customerInfo: customerInfo ?? {},
      note: String(note || ''),
      statusHistory: initStatusHistory({ status: 'pending', paymentStatus: 'pending' }, 'Đơn hàng mới được tạo'),
    });

    if (paymentMethod === 'cod') {
      const payment = await Payment.create({
        order: order._id, user: req.user ? req.user.id : null, amount: total, method: 'cod', status: 'pending',
        couponCode: appliedCoupons.map((c) => c.code).join(', '), discountAmount: discount,
      });
      order.paymentId = payment._id;
      order.paymentStatus = 'pending';
      await order.save();
      return res.status(201).json({ success: true, message: 'Đặt hàng thành công. Thanh toán khi nhận hàng.', order, payment, pricing: { memberDiscountPercent, memberDiscount, couponDiscount: totalCouponDiscount, shippingDiscount: totalShippingDiscount, shipping, discount, total } });
    }

    if (paymentMethod === 'vnpay') {
      const orderInfo = `Thanh toan don hang Moc Mac ${order.orderId || order._id}`;
      const txnRef = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
      const ipAddr = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1').toString().split(',')[0].trim();
      const isMock = String(process.env.VNPAY_MOCK || '').toLowerCase() === 'true';
      const baseUrl = (process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3000}`).replace(/\s+/g, '').replace(/\/+$/, '');
      const payUrl = isMock
        ? `${baseUrl}/api/payments/vnpay/mock?txnRef=${encodeURIComponent(txnRef)}`
        : buildVnpayPaymentUrl({ amount: Math.round(Number(total) || 0), orderId: txnRef, orderInfo, ipAddr, locale: 'vn' }).url;

      const payment = await Payment.create({
        order: order._id, user: req.user ? req.user.id : null, amount: total, method: 'vnpay', status: 'pending',
        transactionId: txnRef, payUrl, note: isMock ? `${orderInfo} (VNPAY mock test)` : orderInfo,
        couponCode: appliedCoupons.map((c) => c.code).join(', '), discountAmount: discount,
      });
      order.paymentId = payment._id;
      order.paymentStatus = 'pending';
      await order.save();
      return res.status(201).json({
        success: true,
        message: isMock ? 'Mở trang thanh toán VNPAY test (mô phỏng).' : 'Tạo đơn hàng thành công. Chuyển hướng đến VNPAY (sandbox test).',
        order, payment, payUrl,
        pricing: { memberDiscountPercent, memberDiscount, couponDiscount: totalCouponDiscount, shippingDiscount: totalShippingDiscount, shipping, discount, total },
      });
    }

    return res.status(400).json({ success: false, message: 'Phương thức thanh toán không hỗ trợ.' });
  } catch (error) {
    console.error('Lỗi tạo thanh toán:', error);
    return res.status(error?.message?.includes('Mã') ? 400 : 500).json({
      success: false,
      message: error?.message || 'Không thể tạo thanh toán. Vui lòng thử lại.',
      error: error.message,
    });
  }
};

export const vnpayMockPage = async (req, res) => {
  try {
    const txnRef = String(req.query.txnRef || '');
    const payment = txnRef ? await Payment.findOne({ transactionId: txnRef, method: 'vnpay' }).populate('order').exec() : null;
    if (!payment) return res.status(404).send('Payment not found');
    const action = `/api/payments/vnpay/mock/pay`;
    const html = `<!doctype html><html lang="vi"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>VNPAY Test (Mộc Mạc)</title>
<style>body{font-family:system-ui,Segoe UI,Roboto,sans-serif;background:#f3f6fb;margin:0;padding:24px;color:#1f2937}
.card{max-width:520px;margin:24px auto;background:#fff;border:1px solid #dbe4f0;border-radius:14px;padding:20px;box-shadow:0 8px 24px rgba(0,0,0,.06)}
h1{margin:0 0 6px;font-size:20px;color:#005baa}.sub{color:#6b7280;font-size:13px;margin-bottom:14px}
.row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px dashed #e5edf7;font-size:14px}
label{display:block;font-size:13px;margin:12px 0 6px;color:#0b3b66;font-weight:600}
input{width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid #cfe0f5;border-radius:10px;font:inherit}
button{width:100%;margin-top:14px;padding:11px 14px;border:0;border-radius:10px;background:#005baa;color:#fff;font:600 14px inherit;cursor:pointer}
.note{margin-top:10px;font-size:12px;color:#6b7280}.fail{background:#b42318;margin-top:8px}</style></head><body>
<div class="card"><h1>VNPAY Sandbox (mô phỏng test)</h1><div class="sub">Mộc Mạc – test luồng nội bộ (không gọi VNPAY thật)</div>
<div class="row"><span>Số tiền</span><strong>${Number(payment.amount || 0).toLocaleString('vi-VN')}đ</strong></div>
<div class="row"><span>Đơn</span><strong>${payment.order?.orderId || payment.order?._id || ''}</strong></div>
<form method="post" action="${action}">
<input type="hidden" name="txnRef" value="${txnRef}"/>
<label>Ngân hàng (test)</label><input name="bank" value="NCB" />
<label>Số thẻ test</label><input name="card" value="9704198526191432198" />
<label>Tên chủ thẻ</label><input name="name" value="NGUYEN VAN A" />
<label>OTP (test)</label><input name="otp" value="123456" />
<button type="submit" name="result" value="success">Xác nhận thanh toán</button>
<button type="submit" name="result" value="fail" class="fail" formnovalidate>Hủy / Thất bại</button>
</form><div class="note">Chế độ mock: VNPAY sandbox thật báo "website chưa được phê duyệt" khi TMN/merchant chưa duyệt. Tắt mock: đặt VNPAY_MOCK=false và dùng TMN_CODE/HASH_SECRET sandbox hợp lệ.</div>
</div></body></html>`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
  } catch (e) {
    return res.status(500).send('VNPAY mock page error');
  }
};

export const vnpayMockPay = async (req, res) => {
  try {
    const txnRef = String(req.body?.txnRef || req.query?.txnRef || '');
    const result = String(req.body?.result || req.query?.result || 'success');
    const payment = txnRef ? await Payment.findOne({ transactionId: txnRef, method: 'vnpay' }).exec() : null;
    if (!payment) return res.redirect(303, `${FRONTEND_URL}/gio-hang?status=error&method=vnpay`);
    const ok = result === 'success';
    payment.status = ok ? 'completed' : 'failed';
    await payment.save();
    const order = await Order.findById(payment.order).exec();
    if (order) {
      order.paymentStatus = ok ? 'paid' : 'failed';
      appendStatusHistory(order, { paymentStatus: order.paymentStatus, note: ok ? 'Thanh toán VNPAY test (mô phỏng) thành công' : 'Thanh toán VNPAY test (mô phỏng) thất bại' });
      await order.save();
    }
    return res.redirect(303, `${FRONTEND_URL}/gio-hang?status=${ok ? 'success' : 'fail'}&method=vnpay`);
  } catch (e) {
    return res.redirect(303, `${FRONTEND_URL}/gio-hang?status=error&method=vnpay`);
  }
};

export const vnpayReturn = async (req, res) => {
  try {
    const result = verifyVnpayReturn(req.query || {});
    const txnRef = result.txnRef;
    const payment = txnRef ? await Payment.findOne({ transactionId: String(txnRef), method: 'vnpay' }).exec() : null;
    if (payment) {
      const ok = result.code === '00';
      payment.status = ok ? 'completed' : 'failed';
      if (!payment.transactionId) payment.transactionId = String(txnRef || '');
      await payment.save();
      const order = await Order.findById(payment.order).exec();
      if (order) {
        order.paymentStatus = ok ? 'paid' : 'failed';
        appendStatusHistory(order, { paymentStatus: order.paymentStatus, note: ok ? 'Thanh toán VNPAY thành công' : `Thanh toán VNPAY thất bại (${result.code || '?'})` });
        await order.save();
      }
      return res.redirect(303, `${FRONTEND_URL}/gio-hang?status=${ok ? 'success' : 'fail'}&method=vnpay`);
    }
    return res.redirect(303, `${FRONTEND_URL}/gio-hang?status=error&method=vnpay`);
  } catch (e) {
    console.error('VNPAY return error:', e);
    return res.redirect(303, `${FRONTEND_URL}/gio-hang?status=error&method=vnpay`);
  }
};

export const vnpayIpn = async (req, res) => {
  try {
    const result = verifyVnpayReturn(req.query || {});
    if (!result.ok) return res.status(200).json({ RspCode: '97', Message: 'Checksum failed' });
    const payment = await Payment.findOne({ transactionId: String(result.txnRef), method: 'vnpay' }).populate('order').exec();
    if (!payment) return res.status(200).json({ RspCode: '01', Message: 'Order not found' });
    if (payment.status === 'completed') return res.status(200).json({ RspCode: '02', Message: 'Order already confirmed' });
    const ok = result.code === '00';
    payment.status = ok ? 'completed' : 'failed';
    await payment.save();
    if (payment.order) {
      payment.order.paymentStatus = ok ? 'paid' : 'failed';
      appendStatusHistory(payment.order, { paymentStatus: payment.order.paymentStatus, note: ok ? 'VNPAY IPN: thành công' : `VNPAY IPN: thất bại (${result.code})` });
      await payment.order.save();
    }
    return res.status(200).json({ RspCode: '00', Message: 'Success' });
  } catch (e) {
    console.error('VNPAY IPN error:', e);
    return res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
  }
};

export const getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user.id })
      .populate('order', 'total status paymentMethod createdAt')
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ success: true, total: payments.length, payments });
  } catch (error) {
    console.error('Lỗi lấy lịch sử thanh toán:', error);
    return res.status(500).json({ success: false, message: 'Không thể lấy lịch sử thanh toán.', error: error.message });
  }
};

export const getPaymentStatus = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).populate('order', 'total status paymentMethod').lean();
    if (!payment) return res.status(404).json({ success: false, message: 'Không tìm thấy giao dịch.' });
    return res.json({ success: true, payment });
  } catch (error) {
    console.error('Lỗi lấy trạng thái thanh toán:', error);
    return res.status(500).json({ success: false, message: 'Không thể lấy thông tin.', error: error.message });
  }
};