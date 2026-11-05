import { Router } from 'express';
import mongoose from 'mongoose';

const router = Router();

const CHUNK_SIZE = 900;
const MAX_CHUNKS = 12;

function chunkText(text, size = CHUNK_SIZE) {
  const out = [];
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  for (let i = 0; i < t.length; i += size) out.push(t.slice(i, i + size));
  return out;
}

function tokenize(q) {
  return [...new Set(String(q || '').toLowerCase().normalize('NFC')
    .split(/[^\p{L}\p{N}]+/u).filter(w => w.length >= 2))].slice(0, 20);
}

function scoreChunk(chunk, tokens) {
  const lc = chunk.toLower();
  let s = 0;
  for (const t of tokens) if (lc.includes(t)) s += 1;
  return s;
}

async function collectDocs() {
  const docs = [];
  const safe = async (name, fn) => { try { const v = await fn(); docs.push(...v.map(x => `[${name}] ${x}`)); } catch {} };

  await safe('Sản phẩm', async () => {
    const m = mongoose.models['Product']; if (!m) return [];
    const rows = await m.find({}).select('name slug price region province cat type story description images badges ocop').limit(120).lean();
    return rows.map(p => `Sản phẩm: ${p.name} | slug:${p.slug} | giá:${p.price}đ | vùng:${p.region||''} ${p.province||''} | loại:${p.cat||''} ${p.type||''} | OCOP:${p.ocop||''} | huy hiệu:${(p.badges||[]).join(',')} | mô tả:${String(p.story||p.description||'').slice(0,400)}`);
  });
  await safe('Vùng miền', async () => {
    const m = mongoose.models['Region']; if (!m) return [];
    const rows = await m.find({}).limit(60).lean();
    return rows.map(r => `Vùng: ${r.name||r.region||r.slug||''} | ${JSON.stringify(r).slice(0,500)}`);
  });
  await safe('Làng nghề/Tỉnh', async () => {
    const m = mongoose.models['Province']; if (!m) return [];
    const rows = await m.find({}).limit(80).lean();
    return rows.map(p => `Tỉnh/Làng nghề: ${p.name||p.slug||''} | ${JSON.stringify(p).slice(0,500)}`);
  });
  await safe('Mã giảm giá', async () => {
    const m = mongoose.models['Coupon']; if (!m) return [];
    const rows = await m.find({ active: { $ne: false } }).select('code type value minOrder maxDiscount expiresAt description').limit(40).lean();
    return rows.map(c => `Coupon: ${c.code} | loại:${c.type} | giá trị:${c.value} | đơn tối thiểu:${c.minOrder||0} | hết hạn:${c.expiresAt||''} | ${c.description||''}`);
  });
  await safe('Thông báo', async () => {
    const m = mongoose.models['Notification']; if (!m) return [];
    const rows = await m.find({}).sort({ createdAt: -1 }).limit(20).lean();
    return rows.map(n => `Thông báo: ${n.title||''} | ${String(n.content||n.message||'').slice(0,300)}`);
  });
  await safe('Chính sách/Liên hệ', async () => {
    const contacts = mongoose.models['Contact'];
    if (contacts) {
      const rows = await contacts.find({}).sort({ createdAt: -1 }).limit(10).lean();
      return rows.map(c => `Liên hệ mẫu: ${c.subject||''} | ${String(c.message||'').slice(0,120)}`);
    }
    return [];
  });
  // static store knowledge
  docs.push('[Cửa hàng] Mộc Mạc chuyên đặc sản làng nghề Việt Nam, sản phẩm OCOP/vùng miền. Hỗ trợ đặt hàng, thanh toán COD/MoMo, mã giảm giá, theo dõi đơn. Liên hệ qua trang Liên hệ hoặc chat với quản trị viên.');
  return docs;
}

function buildAnswer(question, topChunks) {
  if (!topChunks.length) return 'Trợ Lý AI chưa tìm thấy thông tin phù hợp trong dữ liệu. Bạn có thể hỏi về sản phẩm, giá, vùng miền, mã giảm giá, đơn hàng hoặc liên hệ quản trị viên.';
  const ctx = topChunks.map((c, i) => `(${i+1}) ${c}`).join('\n');
  // lightweight extractive response (no external LLM key required)
  const q = String(question||'').toLowerCase();
  const lines = topChunks.map(c => c.replace(/^\[[^\]]+\]\s*/, '')).slice(0,5);
  let hint = 'Dựa trên dữ liệu cửa hàng';
  if (/giá|bao nhiêu|price/.test(q)) hint = 'Thông tin giá/sản phẩm';
  else if (/mã|coupon|giảm/.test(q)) hint = 'Thông tin mã giảm giá';
  else if (/vùng|tỉnh|làng nghề|ocop/.test(q)) hint = 'Thông tin vùng miền/làng nghề';
  else if (/đơn|ship|giao|thanh toán|momo|cod/.test(q)) hint = 'Thông tin đặt hàng/thanh toán';
  return `${hint}:\n- ${lines.join('\n- ')}\n\n(Trợ Lý AI phản hồi từ dữ liệu hệ thống Mộc Mạc, đã quét DB theo từng chunk.)`;
}

router.post('/chat', async (req, res) => {
  try {
    const question = String(req.body?.message || req.body?.question || '').trim();
    if (!question) return res.status(400).json({ success: false, message: 'Vui lòng nhập câu hỏi.' });

    const docs = await collectDocs();
    const allChunks = docs.flatMap(d => chunkText(d));
    const tokens = tokenize(question);
    const ranked = (tokens.length
      ? allChunks.map(c => ({ c, s: scoreChunk(c, tokens) })).filter(x => x.s > 0).sort((a,b)=>b.s-a.s)
      : allChunks.map((c,i)=>({ c, s: 1/(i+1) }))
    ).slice(0, MAX_CHUNKS).map(x => x.c);

    const answer = buildAnswer(question, ranked);
    return res.json({ success: true, answer, chunks: ranked.length, scanned: allChunks.length });
  } catch (e) {
    console.error('AI chat error:', e);
    return res.status(500).json({ success: false, message: 'Trợ Lý AI gặp lỗi, vui lòng thử lại.', error: e.message });
  }
});

export default router;