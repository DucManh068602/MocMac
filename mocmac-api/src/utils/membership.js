import { Order } from '../models/Order.js';
import { QuotationRequest } from '../models/QuotationRequest.js';
import { User } from '../models/User.js';
import { awardFreeShipVouchers } from './freeShipVouchers.js';

export const TIERS = [
  {
    key: 'dong', name: 'Đồng', minSpend: 0, color: '#8a6d3b',
    benefit: 'Bậc khởi đầu cho thành viên Mộc Mạc.',
    discountPercent: 0, freeShipping: false, freeShippingThreshold: 500000, priorityQuotation: false,
    benefits: [
      'Tích lũy chi tiêu từ đơn hàng và báo giá quà tặng đã thanh toán.',
      'Nhận thông tin sản phẩm mới và chương trình ưu đãi.',
      'Áp dụng mã giảm giá của shop khi đủ điều kiện.',
      'Miễn phí vận chuyển khi đơn hàng đạt 500.000đ.',
    ],
  },
  {
    key: 'bac', name: 'Bạc', minSpend: 2_000_000, color: '#7b8794',
    benefit: 'Giảm 5% khi mua hàng và miễn phí vận chuyển đơn từ 300.000đ.',
    discountPercent: 5, freeShipping: false, freeShippingThreshold: 300000, priorityQuotation: true,
    benefits: [
      'Giảm 5% tự động khi mua hàng (áp dụng trên giá trị sản phẩm, hiển thị tại giỏ hàng).',
      'Miễn phí vận chuyển khi đơn hàng đạt 300.000đ.',
      'Nhận thông báo mã giảm giá và ưu đãi sớm.',
      'Ưu tiên hỗ trợ khi đặt hàng quà tặng/báo giá.',
    ],
  },
  {
    key: 'vang', name: 'Vàng', minSpend: 5_000_000, color: '#c99700',
    benefit: 'Giảm 8% khi mua hàng, miễn phí vận chuyển đơn từ 100.000đ và ưu tiên xử lý.',
    discountPercent: 8, freeShipping: false, freeShippingThreshold: 100000, priorityQuotation: true,
    benefits: [
      'Giảm 8% tự động khi mua hàng (áp dụng trên giá trị sản phẩm, hiển thị tại giỏ hàng).',
      'Miễn phí vận chuyển khi đơn hàng đạt 100.000đ.',
      'Ưu tiên xử lý yêu cầu báo giá quà tặng/doanh nghiệp.',
      'Được ưu tiên nhận/gợi ý mã giảm giá phù hợp cho đơn quà tặng số lượng lớn.',
      'Nhận quà tri ân theo các chương trình của Mộc Mạc.',
    ],
  },
  {
    key: 'kimcuong', name: 'Kim Cương', minSpend: 15_000_000, color: '#1f7a8c',
    benefit: 'Giảm 12% khi mua hàng, miễn phí vận chuyển mọi đơn và chăm sóc ưu tiên 1:1.',
    discountPercent: 12, freeShipping: true, freeShippingThreshold: 0, priorityQuotation: true,
    benefits: [
      'Giảm 12% tự động khi mua hàng (áp dụng trên giá trị sản phẩm, hiển thị tại giỏ hàng).',
      'Miễn phí vận chuyển mọi đơn hàng (không tối thiểu).',
      'Chăm sóc ưu tiên 1:1 khi đặt quà tặng cá nhân/doanh nghiệp.',
      'Ưu tiên nhận mã giảm giá/ưu đãi đặc biệt và xử lý báo giá số lượng lớn.',
      'Hỗ trợ và xử lý phát sinh theo chính sách ưu tiên.',
    ],
  },
];

export function resolveTier(totalSpend = 0) {
  const spend = Math.max(0, Number(totalSpend) || 0);
  let current = TIERS[0];
  for (const t of TIERS) if (spend >= t.minSpend) current = t;
  const idx = TIERS.findIndex((t) => t.key === current.key);
  const next = idx >= 0 && idx < TIERS.length - 1 ? TIERS[idx + 1] : null;
  const progress = next ? Math.min(100, Math.round(((spend - current.minSpend) / Math.max(1, next.minSpend - current.minSpend)) * 100)) : 100;
  return { totalSpend: spend, currentTier: current, nextTier: next, amountToNext: next ? Math.max(0, next.minSpend - spend) : 0, progress, tiers: TIERS };
}

function paidQuotationMatch(emailList) {
  return { email: { $in: emailList }, paymentStatus: 'paid', status: { $in: ['accepted', 'done'] } };
}

async function spendForUser(userId, email) {
  const normalizedEmail = String(email || '').toLowerCase().trim();
  const [orders, quotes] = await Promise.all([
    userId ? Order.find({ user: userId, status: { $ne: 'cancelled' }, paymentStatus: { $ne: 'failed' } }).select('total').lean() : Promise.resolve([]),
    normalizedEmail ? QuotationRequest.find(paidQuotationMatch([normalizedEmail])).select('quotedTotal totalEstimate').lean() : Promise.resolve([]),
  ]);
  const orderSpend = orders.reduce((s, o) => s + Math.max(0, Number(o.total) || 0), 0);
  const giftSpend = quotes.reduce((s, q) => s + Math.max(0, Number(q.quotedTotal || q.totalEstimate) || 0), 0);
  return { orderSpend, giftSpend, totalSpend: orderSpend + giftSpend };
}

export async function membershipForUser(user) {
  if (!user) return resolveTier(0);
  const userId = user._id || user.id;
  const spend = await spendForUser(userId, user.email);
  const tier = resolveTier(spend.totalSpend);

  // Tự động tặng phiếu miễn phí vận chuyển mỗi mốc 100.000đ chi tiêu (mỗi mốc 1 lần)
  let vouchers = { awarded: [], eligible: 0, issued: 0 };
  try {
    vouchers = await awardFreeShipVouchers(user, spend.totalSpend);
  } catch (e) {
    console.error('Không thể tặng phiếu miễn phí vận chuyển:', e);
  }

  return { ...tier, ...spend, freeShipVouchers: vouchers };
}

export async function getUsersByTierKeys(tierKeys = []) {
  const wanted = new Set((tierKeys || []).map((k) => String(k || '').trim().toLowerCase()).filter(Boolean));
  if (!wanted.size) return [];
  const users = await User.find({ isActive: { $ne: false } }).select('_id name email role').lean();
  if (!users.length) return [];
  const ids = users.map((u) => u._id);
  const emails = users.map((u) => String(u.email || '').toLowerCase().trim()).filter(Boolean);

  const [orderAgg, quoteAgg] = await Promise.all([
    Order.aggregate([
      { $match: { user: { $in: ids }, status: { $ne: 'cancelled' }, paymentStatus: { $ne: 'failed' } } },
      { $group: { _id: '$user', spend: { $sum: { $ifNull: ['$total', 0] } } } },
    ]),
    QuotationRequest.aggregate([
      { $match: paidQuotationMatch(emails) },
      { $group: { _id: '$email', spend: { $sum: { $ifNull: ['$quotedTotal', { $ifNull: ['$totalEstimate', 0] }] } } } },
    ]),
  ]);

  const orderMap = new Map(orderAgg.map((r) => [String(r._id), Number(r.spend) || 0]));
  const quoteMap = new Map(quoteAgg.map((r) => [String(r._id || '').toLowerCase().trim(), Number(r.spend) || 0]));
  return users.filter((u) => {
    const spend = (orderMap.get(String(u._id)) || 0) + (quoteMap.get(String(u.email || '').toLowerCase().trim()) || 0);
    return wanted.has(resolveTier(spend).currentTier.key);
  });
}

export function tierLabel(keys = []) {
  const map = Object.fromEntries(TIERS.map((t) => [t.key, t.name]));
  return (keys || []).map((k) => map[String(k).toLowerCase()] || k).join(', ');
}