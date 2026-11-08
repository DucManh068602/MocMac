import { SiteContent } from '../models/SiteContent.js';

const ALLOWED = new Set(['terms', 'privacy']);
const DEFAULTS = {
  terms: { key: 'terms', title: 'Điều khoản dịch vụ', sections: [] },
  privacy: { key: 'privacy', title: 'Chính sách bảo vệ dữ liệu', sections: [] },
};

function normalizeKey(key) {
  const k = String(key || '').trim().toLowerCase();
  return ALLOWED.has(k) ? k : null;
}

export const getSiteContent = async (req, res) => {
  const key = normalizeKey(req.params.key);
  if (!key) return res.status(404).json({ message: 'Nội dung không hợp lệ.' });
  const doc = await SiteContent.findOne({ key }).lean();
  res.json({ content: doc || DEFAULTS[key] });
};

export const upsertSiteContent = async (req, res) => {
  const key = normalizeKey(req.params.key);
  if (!key) return res.status(404).json({ message: 'Nội dung không hợp lệ.' });
  const title = String(req.body?.title || DEFAULTS[key].title).trim() || DEFAULTS[key].title;
  const rawSections = Array.isArray(req.body?.sections) ? req.body.sections : [];
  const sections = rawSections
    .map((s) => ({ heading: String(s?.heading || '').trim(), body: String(s?.body || '').trim() }))
    .filter((s) => s.heading || s.body);

  const content = await SiteContent.findOneAndUpdate(
    { key },
    { key, title, sections, updatedBy: req.user?.id || null },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
  ).lean();

  res.json({ content, message: 'Đã lưu nội dung.' });
};
