import { FlashSale } from '../models/FlashSale.js';

const publicSale = (sale) => {
  const value = sale?.toObject ? sale.toObject() : sale;
  const now = new Date();
  const live = Boolean(value?.active && value?.startsAt && value?.endsAt && new Date(value.startsAt) <= now && new Date(value.endsAt) >= now);
  return { ...(value || { key: 'storewide', active: false, discountPercent: 0, startsAt: null, endsAt: null }), live };
};

export const getFlashSale = async (_req, res) => res.json({ sale: publicSale(await FlashSale.findOne({ key: 'storewide' }).lean()) });

export const updateFlashSale = async (req, res) => {
  const { active, discountPercent, startsAt, endsAt } = req.body || {};
  if (active && (!startsAt || !endsAt || !Number(discountPercent))) return res.status(400).json({ message: 'Nhập phần trăm và khoảng thời gian Săn sale.' });
  if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) return res.status(400).json({ message: 'Thời gian kết thúc phải sau thời gian bắt đầu.' });
  if (discountPercent !== undefined && (Number(discountPercent) < 1 || Number(discountPercent) > 90)) return res.status(400).json({ message: 'Mức giảm phải từ 1% đến 90%.' });
  const sale = await FlashSale.findOneAndUpdate({ key: 'storewide' }, { key: 'storewide', active: Boolean(active), discountPercent: Number(discountPercent) || 0, startsAt: startsAt || null, endsAt: endsAt || null }, { new: true, upsert: true, runValidators: true });
  res.json({ sale: publicSale(sale) });
};

export const deleteFlashSale = async (_req, res) => {
  await FlashSale.deleteOne({ key: 'storewide' });
  res.json({ sale: publicSale(null) });
};
