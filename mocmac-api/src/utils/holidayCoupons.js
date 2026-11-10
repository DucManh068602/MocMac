import { Coupon } from '../models/Coupon.js';

function pad(n) { return String(n).padStart(2, '0'); }
function ymd(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }

function slug(s) {
  return String(s || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z0-9]+/g, '')
    .toUpperCase()
    .slice(0, 10);
}

function randSuffix(len = 4) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function makeCode(prefix) {
  return `${slug(prefix)}${randSuffix(4)}`;
}

// Fixed-date Vietnamese holidays (month is 1-based)
const FIXED_HOLIDAYS = [
  { key: 'new-year', name: 'Tết Dương Lịch', month: 1, day: 1, days: 3, discountType: 'percent', discountValue: 10, minOrderValue: 200000 },
  { key: 'valentine', name: 'Valentine', month: 2, day: 14, days: 3, discountType: 'percent', discountValue: 14, minOrderValue: 150000 },
  { key: 'women-8-3', name: 'Quốc tế Phụ nữ 8/3', month: 3, day: 8, days: 5, discountType: 'percent', discountValue: 15, minOrderValue: 200000 },
  { key: 'hung-kings', name: 'Giỗ Tổ Hùng Vương', month: 4, day: 18, days: 4, discountType: 'percent', discountValue: 10, minOrderValue: 200000 },
  { key: 'liberation-30-4', name: '30/4 Giải phóng', month: 4, day: 30, days: 3, discountType: 'percent', discountValue: 12, minOrderValue: 200000 },
  { key: 'labor-1-5', name: 'Quốc tế Lao động 1/5', month: 5, day: 1, days: 3, discountType: 'percent', discountValue: 12, minOrderValue: 200000 },
  { key: 'children-1-6', name: 'Quốc tế Thiếu nhi 1/6', month: 6, day: 1, days: 5, discountType: 'percent', discountValue: 10, minOrderValue: 150000 },
  { key: 'family-28-6', name: 'Ngày Gia đình Việt Nam', month: 6, day: 28, days: 5, discountType: 'fixed', discountValue: 50000, minOrderValue: 300000 },
  { key: 'national-2-9', name: 'Quốc Khánh 2/9', month: 9, day: 2, days: 4, discountType: 'percent', discountValue: 15, minOrderValue: 200000 },
  { key: 'women-20-10', name: 'Phụ nữ Việt Nam 20/10', month: 10, day: 20, days: 5, discountType: 'percent', discountValue: 15, minOrderValue: 200000 },
  { key: 'teacher-20-11', name: 'Nhà giáo Việt Nam 20/11', month: 11, day: 20, days: 5, discountType: 'percent', discountValue: 15, minOrderValue: 150000 },
  { key: 'christmas', name: 'Giáng Sinh', month: 12, day: 25, days: 5, discountType: 'percent', discountValue: 12, minOrderValue: 200000 },
];

// Lunar-ish holidays approximated by fixed windows each year (admin can adjust dates)
const SEASONAL_WINDOWS = [
  { key: 'tet', name: 'Tết Nguyên Đán', startMonth: 1, startDay: 20, days: 14, discountType: 'percent', discountValue: 20, minOrderValue: 300000, maxDiscount: 200000 },
  { key: 'mid-autumn', name: 'Tết Trung Thu', startMonth: 9, startDay: 10, days: 10, discountType: 'percent', discountValue: 15, minOrderValue: 200000 },
];

export function getUpcomingHolidays({ from = new Date(), months = 3 } = {}) {
  const start = new Date(from);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setMonth(end.getMonth() + months);
  const year = start.getFullYear();
  const years = [year, year + 1];
  const out = [];

  for (const y of years) {
    for (const h of FIXED_HOLIDAYS) {
      const d = new Date(y, h.month - 1, h.day);
      if (d >= start && d <= end) {
        out.push({
          key: `${h.key}-${y}`,
          holidayKey: h.key,
          name: h.name,
          date: ymd(d),
          startsAt: ymd(addDays(d, -2)),
          expiresAt: ymd(addDays(d, h.days - 1)),
          suggestedCode: makeCode(h.key.replace(/-/g, '').slice(0, 6)),
          discountType: h.discountType,
          discountValue: h.discountValue,
          minOrderValue: h.minOrderValue,
          maxDiscount: h.maxDiscount || 0,
          usageLimit: 0,
          description: `Mã ưu đãi ${h.name} - tự động tạo theo ngày lễ.`,
        });
      }
    }
    for (const h of SEASONAL_WINDOWS) {
      const d = new Date(y, h.startMonth - 1, h.startDay);
      if (d >= start && d <= end) {
        out.push({
          key: `${h.key}-${y}`,
          holidayKey: h.key,
          name: h.name,
          date: ymd(d),
          startsAt: ymd(addDays(d, -3)),
          expiresAt: ymd(addDays(d, h.days - 1)),
          suggestedCode: makeCode(h.key),
          discountType: h.discountType,
          discountValue: h.discountValue,
          minOrderValue: h.minOrderValue,
          maxDiscount: h.maxDiscount || 0,
          usageLimit: 0,
          description: `Mã ưu đãi ${h.name} (cửa sổ gợi ý, có thể chỉnh ngày) - tự động tạo.`,
          seasonal: true,
        });
      }
    }
  }
  out.sort((a, b) => a.date.localeCompare(b.date));
  return out;
}

export async function generateHolidayCoupons(items = []) {
  const created = [];
  const skipped = [];
  for (const item of items) {
    const code = String(item.code || item.suggestedCode || makeCode(item.holidayKey || 'HOLIDAY')).toUpperCase().trim();
    if (!code) continue;
    const exists = await Coupon.findOne({ code }).lean();
    if (exists) { skipped.push({ code, reason: 'exists' }); continue; }
    const expiryDate = item.expiresAt || item.expiryDate;
    const startsAt = item.startsAt || item.starts_at;
    if (!expiryDate) { skipped.push({ code, reason: 'missing_expiry' }); continue; }
    const coupon = await Coupon.create({
      code,
      description: item.description || `Mã ưu đãi ${item.name || 'ngày lễ'}`,
      discountType: item.discountType || 'percent',
      discountValue: Number(item.discountValue ?? 10),
      minOrderValue: Number(item.minOrderValue ?? 0),
      maxDiscount: Number(item.maxDiscount ?? 0),
      usageLimit: Number(item.usageLimit ?? 0),
      startsAt: startsAt ? new Date(startsAt) : null,
      expiryDate,
      active: true,
    });
    created.push(coupon.toObject());
  }
  return { created, skipped };
}
