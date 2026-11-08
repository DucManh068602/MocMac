import { RegionStory } from '../models/RegionStory.js';

export const listRegionStories = async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = String(req.query.status);
  const stories = await RegionStory.find(filter).sort({ order: -1, createdAt: -1 }).lean();
  res.json({ stories });
};

export const createRegionStory = async (req, res) => {
  const { title, region, excerpt, content, imageUrl, status, order } = req.body || {};
  if (!String(title || '').trim()) return res.status(400).json({ message: 'Vui lòng nhập tiêu đề câu chuyện.' });
  const story = await RegionStory.create({
    title: String(title).trim(),
    region: String(region || '').trim(),
    excerpt: String(excerpt || '').trim(),
    content: String(content || '').trim(),
    imageUrl: String(imageUrl || '').trim(),
    status: status === 'draft' ? 'draft' : 'published',
    order: Number(order) || 0,
  });
  res.status(201).json({ story });
};

export const updateRegionStory = async (req, res) => {
  const patch = {};
  for (const key of ['title', 'region', 'excerpt', 'content', 'imageUrl']) {
    if (req.body?.[key] !== undefined) patch[key] = String(req.body[key] || '').trim();
  }
  if (req.body?.status !== undefined) patch.status = req.body.status === 'draft' ? 'draft' : 'published';
  if (req.body?.order !== undefined) patch.order = Number(req.body.order) || 0;
  if (patch.title !== undefined && !patch.title) return res.status(400).json({ message: 'Tiêu đề không được để trống.' });
  const story = await RegionStory.findByIdAndUpdate(req.params.id, patch, { new: true, runValidators: true }).lean();
  if (!story) return res.status(404).json({ message: 'Không tìm thấy câu chuyện.' });
  res.json({ story });
};

export const deleteRegionStory = async (req, res) => {
  const story = await RegionStory.findByIdAndDelete(req.params.id).lean();
  if (!story) return res.status(404).json({ message: 'Không tìm thấy câu chuyện.' });
  res.json({ ok: true });
};
