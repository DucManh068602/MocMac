import { Coupon } from '../models/Coupon.js';
import { logAction, getRequestInfo } from '../utils/auditLog.js';
import { membershipForUser } from '../utils/membership.js';
import { getUpcomingHolidays, generateHolidayCoupons } from '../utils/holidayCoupons.js';

const computeStatus = (c) => {
  if (!c.active) return 'vô hiệu';
  if (new Date(c.expiryDate) < new Date()) return 'hết hạn';
  if (c.usageLimit > 0 && c.usedCount >= c.usageLimit) return 'hết lượt sử dụng';
  return 'hoạt động';
};
const couponLabel = (c) => c?.discountType === 'percent' ? `giảm ${c.discountValue}%` : `giảm ${Number(c?.discountValue || 0).toLocaleString('vi-VN')}đ`;

export const getAllCoupons = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Number(req.query.limit) || 20);
    const skip = (page - 1) * limit;
    const filter = {};
    if (req.query.q) filter.code = new RegExp(String(req.query.q), 'i');
    if (req.query.active !== undefined) filter.active = req.query.active === 'true';
    const sort = {}; sort[String(req.query.sortBy || 'createdAt')] = req.query.sortDir === 'asc' ? 1 : -1;
    const [coupons, total] = await Promise.all([Coupon.find(filter).sort(sort).skip(skip).limit(limit).lean(), Coupon.countDocuments(filter)]);
    return res.json({ success: true, total, page, limit, totalPages: Math.ceil(total / limit), coupons: coupons.map((c) => ({ ...c, status: computeStatus(c) })) });
  } catch (error) {
    console.error('Lỗi lấy danh sách mã giảm giá:', error);
    return res.status(500).json({ success: false, message: 'Không thể lấy danh sách.', error: error.message });
  }
};

export const getCouponByCode = async (req, res) => {
  try {
    const coupon = await Coupon.findOne({ code: req.params.code.toUpperCase() }).lean();
    if (!coupon) return res.status(404).json({ success: false, message: 'Mã giảm giá không tồn tại.' });
    if (!coupon.active) return res.status(400).json({ success: false, message: 'Mã giảm giá đã vô hiệu.' });
    if (new Date(coupon.expiryDate) < new Date()) return res.status(400).json({ success: false, message: 'Mã giảm giá đã hết hạn.' });
    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) return res.status(400).json({ success: false, message: 'Mã giảm giá đã hết lượt sử dụng.' });
    return res.json({ success: true, coupon: { ...coupon, status: computeStatus(coupon) } });
  } catch (error) {
    console.error('Lỗi tìm mã giảm giá:', error);
    return res.status(500).json({ success: false, message: 'Không thể tìm mã.', error: error.message });
  }
};

export const validateCoupon = async (req, res) => {
  try {
    const { orderTotal } = req.query;
    const code = req.params?.code ?? req.query?.code;
    if (!code) return res.status(400).json({ success: false, message: 'Vui lòng nhập mã giảm giá.' });
    const coupon = await Coupon.findOne({ code: String(code).toUpperCase() }).lean();
    if (!coupon) return res.status(404).json({ success: false, message: 'Mã giảm giá không tồn tại.' });
    if (!coupon.active) return res.status(400).json({ success: false, message: 'Mã giảm giá không còn kích hoạt.' });
    if (new Date(coupon.expiryDate) < new Date()) return res.status(400).json({ success: false, message: 'Mã giảm giá đã hết hạn.' });
    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) return res.status(400).json({ success: false, message: 'Mã giảm giá đã hết lượt sử dụng.' });
    // Coupon applies after automatic member discount in cart/checkout UI.
    const membership = req.user ? await membershipForUser(req.user) : null;
    const memberDiscountPercent = Number(membership?.currentTier?.discountPercent || 0);
    const memberDiscount = Math.round(Number(orderTotal || 0) * memberDiscountPercent / 100);
    const eligibleBase = Math.max(0, Number(orderTotal || 0) - memberDiscount);
    if (coupon.minOrderValue > 0 && eligibleBase < coupon.minOrderValue) {
      return res.status(400).json({ success: false, message: `Đơn hàng tối thiểu ${Number(coupon.minOrderValue).toLocaleString('vi-VN')}đ (sau ưu đãi thành viên) để áp dụng mã này.` });
    }
    let discountAmount = coupon.discountType === 'percent' ? Math.round(eligibleBase * coupon.discountValue / 100) : Number(coupon.discountValue || 0);
    if (coupon.discountType === 'percent' && coupon.maxDiscount > 0) discountAmount = Math.min(discountAmount, coupon.maxDiscount);
    return res.json({ success: true, message: `Mã ${coupon.code} hợp lệ: ${couponLabel(coupon)}.`, code: coupon.code, status: computeStatus(coupon), discountType: coupon.discountType, discountValue: coupon.discountValue, discountAmount: Math.max(0, discountAmount), description: coupon.description || '', memberDiscountPercent, memberDiscount, eligibleBase });
  } catch (error) {
    console.error('Lỗi xác thực mã giảm giá:', error);
    const { user, ip } = getRequestInfo(req);
    await logAction({ action: 'coupon.validate_error', resourceType: 'Coupon', user, ip, details: { code: req.params?.code ?? req.query?.code, error: error.message }, status: 'failed' });
    return res.status(500).json({ success: false, message: 'Không thể xác thực.', error: error.message });
  }
};

export const createCoupon = async (req, res) => {
  try {
    const { code, description, discountType, discountValue, minOrderValue, maxDiscount, usageLimit, expiryDate, active = true } = req.body ?? {};
    if (!code || discountValue === undefined || discountValue === null || discountValue === '') return res.status(400).json({ success: false, message: 'Vui lòng nhập mã và giá trị giảm.' });
    if (!expiryDate) return res.status(400).json({ success: false, message: 'Vui lòng chọn ngày hết hạn.' });
    const normalizedCode = String(code).toUpperCase().trim();
    const exists = await Coupon.findOne({ code: normalizedCode }).lean();
    if (exists) return res.status(409).json({ success: false, message: `Mã ${normalizedCode} đã tồn tại.` });
    const coupon = await Coupon.create({ code: normalizedCode, description: description ?? '', discountType: discountType ?? 'percent', discountValue: Number(discountValue), minOrderValue: Number(minOrderValue ?? 0), maxDiscount: Number(maxDiscount ?? 0), usageLimit: Number(usageLimit ?? 0), expiryDate, active: !!active });
    const { user, ip } = getRequestInfo(req);
    await logAction({ action: 'coupon.create', resourceType: 'Coupon', resourceId: coupon._id, user, ip, details: { code: coupon.code, discountType: coupon.discountType, discountValue: coupon.discountValue, expiryDate: coupon.expiryDate } });
    return res.status(201).json({ success: true, message: `Đã tạo mã ${coupon.code} (${couponLabel(coupon)}).`, coupon: { ...coupon.toObject(), status: computeStatus(coupon) } });
  } catch (error) {
    console.error('Lỗi tạo mã giảm giá:', error);
    return res.status(500).json({ success: false, message: error?.code === 11000 ? 'Mã giảm giá đã tồn tại.' : 'Không thể tạo mã.', error: error.message });
  }
};

export const updateCoupon = async (req, res) => {
  try {
    const { code, description, discountType, discountValue, minOrderValue, maxDiscount, usageLimit, expiryDate, active } = req.body ?? {};
    const payload = { description, discountType, discountValue, minOrderValue, maxDiscount, usageLimit, expiryDate, active };
    if (code !== undefined) payload.code = String(code).toUpperCase().trim();
    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
    const updated = await Coupon.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Không tìm thấy mã giảm giá.' });
    const { user, ip } = getRequestInfo(req);
    await logAction({ action: 'coupon.update', resourceType: 'Coupon', resourceId: updated._id, user, ip, details: { code: updated.code, active: updated.active } });
    return res.json({ success: true, message: `Đã cập nhật mã ${updated.code}.`, coupon: { ...updated.toObject(), status: computeStatus(updated) } });
  } catch (error) {
    console.error('Lỗi cập nhật mã giảm giá:', error);
    return res.status(500).json({ success: false, message: error?.code === 11000 ? 'Mã giảm giá đã tồn tại.' : 'Không thể cập nhật.', error: error.message });
  }
};

export const deleteCoupon = async (req, res) => {
  try {
    const deleted = await Coupon.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Không tìm thấy mã giảm giá.' });
    const { user, ip } = getRequestInfo(req);
    await logAction({ action: 'coupon.delete', resourceType: 'Coupon', resourceId: deleted._id, user, ip, details: { code: deleted.code } });
    return res.json({ success: true, message: `Đã xóa mã ${deleted.code}.` });
  } catch (error) {
    console.error('Lỗi xóa mã giảm giá:', error);
    return res.status(500).json({ success: false, message: 'Không thể xóa.', error: error.message });
  }
};

export const previewHolidayCoupons = async (req, res) => {
  try {
    const months = Math.min(12, Math.max(1, Number(req.query.months) || 3));
    const holidays = getUpcomingHolidays({ months });
    const codes = holidays.map((h) => h.suggestedCode).filter(Boolean);
    const existing = await Coupon.find({ code: { $in: codes } }).select('code').lean();
    const existingSet = new Set(existing.map((c) => c.code));
    return res.json({
      success: true,
      holidays: holidays.map((h) => ({ ...h, alreadyExists: existingSet.has(h.suggestedCode) })),
    });
  } catch (error) {
    console.error('Lỗi xem trước mã ngày lễ:', error);
    return res.status(500).json({ success: false, message: 'Không thể lấy gợi ý mã ngày lễ.', error: error.message });
  }
};

export const createHolidayCoupons = async (req, res) => {
  try {
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    if (!items.length) return res.status(400).json({ success: false, message: 'Chưa chọn ngày lễ để tạo mã.' });
    const result = await generateHolidayCoupons(items);
    const { user, ip } = getRequestInfo(req);
    await logAction({
      action: 'coupon.create_holiday',
      resourceType: 'Coupon',
      user,
      ip,
      details: { created: result.created.map((c) => c.code), skipped: result.skipped },
    });
    return res.json({
      success: true,
      message: `Đã tạo ${result.created.length} mã ngày lễ${result.skipped.length ? `, bỏ qua ${result.skipped.length} mã` : ''}.`,
      ...result,
    });
  } catch (error) {
    console.error('Lỗi tạo mã ngày lễ:', error);
    return res.status(500).json({ success: false, message: 'Không thể tạo mã ngày lễ.', error: error.message });
  }
};