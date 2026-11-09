import { VillageStory } from '../models/VillageStory.js';

export const getVillageStoryById = async (req, res) => {
  const story = await VillageStory.findById(req.params.id).lean();
  if (!story) return res.status(404).json({ message: 'Không tìm thấy câu chuyện.' });
  res.json({ story });
};

export const listVillageStories = async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = String(req.query.status);
  if (req.query.village) filter.village = String(req.query.village);
  if (req.query.province) filter.province = String(req.query.province);
  const stories = await VillageStory.find(filter).sort({ order: -1, createdAt: -1 }).lean();
  res.json({ stories });
};

export const createVillageStory = async (req, res) => {
  const { title, village, province, craft, excerpt, content, imageUrl, status, order } = req.body || {};
  if (!String(title || '').trim()) return res.status(400).json({ message: 'Vui lòng nhập tiêu đề câu chuyện.' });
  const story = await VillageStory.create({
    title: String(title).trim(),
    village: String(village || '').trim(),
    province: String(province || '').trim(),
    craft: String(craft || '').trim(),
    excerpt: String(excerpt || '').trim(),
    content: String(content || '').trim(),
    imageUrl: String(imageUrl || '').trim(),
    status: status === 'draft' ? 'draft' : 'published',
    order: Number(order) || 0,
  });
  res.status(201).json({ story });
};

export const updateVillageStory = async (req, res) => {
  const patch = {};
  for (const key of ['title', 'village', 'province', 'craft', 'excerpt', 'content', 'imageUrl']) {
    if (req.body?.[key] !== undefined) patch[key] = String(req.body[key] || '').trim();
  }
  if (req.body?.status !== undefined) patch.status = req.body.status === 'draft' ? 'draft' : 'published';
  if (req.body?.order !== undefined) patch.order = Number(req.body.order) || 0;
  if (patch.title !== undefined && !patch.title) return res.status(400).json({ message: 'Tiêu đề không được để trống.' });
  const story = await VillageStory.findByIdAndUpdate(req.params.id, patch, { new: true, runValidators: true }).lean();
  if (!story) return res.status(404).json({ message: 'Không tìm thấy câu chuyện.' });
  res.json({ story });
};

export const deleteVillageStory = async (req, res) => {
  const story = await VillageStory.findByIdAndDelete(req.params.id).lean();
  if (!story) return res.status(404).json({ message: 'Không tìm thấy câu chuyện.' });
  res.json({ ok: true });
};
