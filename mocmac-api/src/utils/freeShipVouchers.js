import { Coupon } from '../models/Coupon.js';
import { User } from '../models/User.js';

const SHIPPING_DISCOUNT_AMOUNT = 30000;
const VOUCHER_STEP = 500000;

function eligibleVouchers(totalSpend) {
  return Math.floor(Math.max(0, Number(totalSpend || 0)) / VOUCHER_STEP);
}

function randSuffix(len = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function makeCode() {
  return `FS-${randSuffix(8)}`;
}

export async function awardFreeShipVouchers(user, totalSpend) {
  if (!user || !user._id) return { awarded: [], totalSpend, eligible: 0, issued: 0 };
  const eligible = eligibleVouchers(totalSpend);
  const issued = Number(user.freeShipVouchersIssued || 0);
  const toAward = Math.max(0, eligible - issued);
  if (toAward === 0) return { awarded: [], totalSpend, eligible, issued };

  const awarded = [];
  for (let i = 0; i < toAward; i++) {
    let code;
    let exists = true;
    while (exists) {
      code = makeCode();
      const found = await Coupon.findOne({ code }).lean();
      exists = Boolean(found);
    }
    const coupon = await Coupon.create({
      code,
      description: `Phiếu giảm phí vận chuyển ${SHIPPING_DISCOUNT_AMOUNT.toLocaleString('vi-VN')}đ (mốc ${(issued + i + 1) * VOUCHER_STEP}.000đ)`,
      discountType: 'fixed',
      discountValue: 0,
      minOrderValue: 0,
      maxDiscount: 0,
      usageLimit: 1,
      usedCount: 0,
      startsAt: new Date(),
      expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      active: true,
      freeShipping: false,
      shippingDiscount: SHIPPING_DISCOUNT_AMOUNT,
    });
    awarded.push(coupon.toObject());
  }

  await User.findByIdAndUpdate(user._id, { $set: { freeShipVouchersIssued: eligible } });
  return { awarded, totalSpend, eligible, issued };
}

export async function listFreeShipVouchers(user) {
  if (!user || !user._id) return [];
  const issued = Number(user.freeShipVouchersIssued || 0);
  if (issued <= 0) return [];
  const coupons = await Coupon.find({
    shippingDiscount: { $gt: 0 },
    description: /^Phiếu giảm phí vận chuyển/,
  }).sort({ createdAt: -1 }).limit(issued).lean();
  return coupons.map((c) => ({
    code: c.code,
    description: c.description,
    shippingDiscount: c.shippingDiscount,
    active: c.active,
    usedCount: c.usedCount || 0,
    usageLimit: c.usageLimit || 0,
    expiryDate: c.expiryDate,
    createdAt: c.createdAt,
  }));
}

export { VOUCHER_STEP, eligibleVouchers, SHIPPING_DISCOUNT_AMOUNT };
