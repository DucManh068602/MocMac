import { Deal } from '../models/Deal.js';

export const listDeals = async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.max(1, Number(req.query.limit) || 20);
  const filter = req.query.q ? { title: new RegExp(String(req.query.q), 'i') } : {};
  if (req.query.active !== undefined) filter.active = req.query.active === 'true';
  const [deals, total] = await Promise.all([Deal.find(filter).sort({ startsAt: -1 }).skip((page - 1) * limit).limit(limit).lean(), Deal.countDocuments(filter)]);
  res.json({ deals, total, page, totalPages: Math.ceil(total / limit) });
};
export const createDeal = async (req, res) => {
  const { title, discountValue, startsAt, endsAt } = req.body || {};
  if (!title || discountValue === undefined || !startsAt || !endsAt) return res.status(400).json({ message: 'Vui lòng nhập đủ thông tin Deal.' });
  if (new Date(endsAt) <= new Date(startsAt)) return res.status(400).json({ message: 'Thời gian kết thúc phải sau thời gian bắt đầu.' });
  const deal = await Deal.create(req.body);
  res.status(201).json({ deal });
};
export const updateDeal = async (req, res) => {
  const deal = await Deal.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!deal) return res.status(404).json({ message: 'Không tìm thấy Deal.' });
  res.json({ deal });
};
export const deleteDeal = async (req, res) => {
  const deal = await Deal.findByIdAndDelete(req.params.id);
  if (!deal) return res.status(404).json({ message: 'Không tìm thấy Deal.' });
  res.json({ success: true });
};
