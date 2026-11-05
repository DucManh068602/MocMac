import { Router } from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

const router = Router();

const CHUNK_SIZE = 900;
const MAX_CHUNKS = 12;
const JWT_SECRET = process.env.JWT_SECRET || 'mocmac-secret';

function chunkText(text, size = CHUNK_SIZE) {
  const out = [];
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  for (let i = 0; i < t.length; i += size) out.push(t.slice(i, i + size));
  return out;
}

function tokenize(q) {
  return [...new Set(String(q || '').toLowerCase().normalize('NFC')
    .split(/[^\p{L}\p{N}]+/u).filter(w => w.length >= 2))].slice(0, 24);
}

function scoreChunk(chunk, tokens) {
  const lc = chunk.toLowerCase();
  let s = 0;
  for (const t of tokens) if (lc.includes(t)) s += 1;
  return s;
}

function norm(s) { return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d'); }

async function collectDocs() {
  const docs = [];
  const safe = async (name, fn) => { try { const v = await fn(); docs.push(...v.map(x => `[${name}] ${x}`)); } catch {} };

  await safe('Sản phẩm', async () => {
    const m = mongoose.models['Product']; if (!m) return [];
    const rows = await m.find({}).select('name slug price region province cat type story description badges ocop id').limit(160).lean();
    return rows.map(p => `Sản phẩm: ${p.name} | slug:${p.slug} | id:${p.id||''} | giá:${p.price}đ | vùng:${p.region||''} ${p.province||''} | loại:${p.cat||''} ${p.type||''} | OCOP:${p.ocop||''} | huy hiệu:${(p.badges||[]).join(',')} | mô tả:${String(p.story||p.description||'').slice(0,300)}`);
  });
  await safe('Vùng miền', async () => { const m = mongoose.models['Region']; if (!m) return []; return (await m.find({}).limit(60).lean()).map(r => `Vùng: ${r.name||r.region||r.slug||''} | ${JSON.stringify(r).slice(0,400)}`); });
  await safe('Làng nghề/Tỉnh', async () => { const m = mongoose.models['Province']; if (!m) return []; return (await m.find({}).limit(80).lean()).map(p => `Tỉnh/Làng nghề: ${p.name||p.slug||''} | ${JSON.stringify(p).slice(0,400)}`); });
  await safe('Mã giảm giá', async () => {
    const m = mongoose.models['Coupon']; if (!m) return [];
    return (await m.find({ active: { $ne: false } }).select('code type value minOrder maxDiscount expiresAt description').limit(40).lean())
      .map(c => `Coupon: ${c.code} | loại:${c.type} | giá trị:${c.value} | đơn tối thiểu:${c.minOrder||0} | hết hạn:${c.expiresAt||''} | ${c.description||''}`);
  });
  await safe('Thông báo', async () => { const m = mongoose.models['Notification']; if (!m) return []; return (await m.find({}).sort({ createdAt: -1 }).limit(20).lean()).map(n => `Thông báo: ${n.title||''} | ${String(n.content||n.message||'').slice(0,250)}`); });
  docs.push('[Cửa hàng] Mộc Mạc chuyên đặc sản làng nghề Việt Nam, sản phẩm OCOP/vùng miền. Hỗ trợ đặt hàng, thanh toán COD/VNPAY (sandbox test), mã giảm giá, theo dõi đơn. Liên hệ qua trang Liên hệ hoặc chat tab Hỗ trợ.');
  docs.push('[Điều hướng] Trang: /san-pham (sản phẩm), /gio-hang (giỏ hàng), /don-hang (đơn hàng), /lien-he (liên hệ), /ho-tro (hỗ trợ), /vung-mien (vùng miền/làng nghề), /tra-cuu-don-hang/<mã> (tra cứu đơn). Sản phẩm chi tiết: /san-pham/<slug>.');
  return docs;
}

function getUserFromReq(req) {
  try {
    const h = req.headers.authorization || '';
    const token = h.startsWith('Bearer ') ? h.slice(7) : null;
    if (!token) return null;
    return jwt.verify(token, JWT_SECRET);
  } catch { return null; }
}

// ---------- Agent tools ----------
const TOOLS = [
  { name:'search_products', description:'Tìm sản phẩm trong DB theo từ khóa/tên/vùng/loại/giá gần đúng.', parameters:{ type:'object', properties:{ query:{type:'string'}, limit:{type:'number'} }, required:['query'] } },
  { name:'get_product', description:'Lấy chi tiết 1 sản phẩm theo slug hoặc tên.', parameters:{ type:'object', properties:{ slug:{type:'string'}, name:{type:'string'} } } },
  { name:'list_coupons', description:'Liệt kê mã giảm giá đang hoạt động.', parameters:{ type:'object', properties:{} } },
  { name:'validate_coupon', description:'Kiểm tra mã giảm giá với tổng đơn (nếu có).', parameters:{ type:'object', properties:{ code:{type:'string'}, orderTotal:{type:'number'} }, required:['code'] } },
  { name:'track_order', description:'Tra cứu đơn hàng công khai theo mã đơn (orderId/id).', parameters:{ type:'object', properties:{ orderId:{type:'string'} }, required:['orderId'] } },
  { name:'my_orders', description:'Lấy đơn hàng của người dùng đang đăng nhập (nếu có token).', parameters:{ type:'object', properties:{ limit:{type:'number'} } } },
  { name:'ui_action', description:'Đề xuất hành động giao diện cho khách: điều hướng, mở sản phẩm, thêm vào giỏ, mở giỏ hàng/liên hệ/đơn hàng.', parameters:{ type:'object', properties:{ action:{type:'string', enum:['navigate','open_product','add_to_cart','open_cart','contact_support','my_orders']}, path:{type:'string'}, slug:{type:'string'}, productId:{type:'number'}, name:{type:'string'}, quantity:{type:'number'} }, required:['action'] } },
];

async function runTool(name, args, req) {
  const P = mongoose.models['Product'], C = mongoose.models['Coupon'], O = mongoose.models['Order'];
  try {
    if (name === 'search_products') {
      if (!P) return { items: [] };
      const q = String(args?.query||'').trim();
      const nq = norm(q);
      const rows = await P.find({}).select('name slug id price region province cat type ocop badges inStock stock').limit(120).lean();
      const items = rows.filter(p => norm([p.name,p.slug,p.region,p.province,p.cat,p.type].join(' ')).includes(nq)).slice(0, Math.min(8, Number(args?.limit)||6))
        .map(p => ({ name:p.name, slug:p.slug, id:p.id, price:p.price, region:p.region, province:p.province, cat:p.cat, type:p.type, ocop:p.ocop, inStock:p.inStock!==false && (p.stock==null || p.stock>0) }));
      return { items, query:q };
    }
    if (name === 'get_product') {
      if (!P) return { product:null };
      const slug = String(args?.slug||'').trim();
      const nameQ = String(args?.name||'').trim();
      let p = slug ? await P.findOne({ slug }).select('name slug id price region province cat type ocop badges story description inStock stock').lean() : null;
      if (!p && nameQ) { const nq=norm(nameQ); const rows=await P.find({}).select('name slug id price region province cat type ocop badges story description inStock stock').limit(120).lean(); p=rows.find(r=>norm(r.name).includes(nq))||null; }
      return { product: p ? { name:p.name, slug:p.slug, id:p.id, price:p.price, region:p.region, province:p.province, cat:p.cat, type:p.type, ocop:p.ocop, badges:p.badges||[], description:String(p.story||p.description||'').slice(0,320), inStock:p.inStock!==false } : null };
    }
    if (name === 'list_coupons') {
      if (!C) return { coupons: [] };
      const now = new Date();
      const rows = await C.find({ active: { $ne: false } }).select('code type value minOrder maxDiscount expiresAt description').limit(20).lean();
      return { coupons: rows.map(c => ({ code:c.code, type:c.type, value:c.value, minOrder:c.minOrder||0, maxDiscount:c.maxDiscount, expiresAt:c.expiresAt, valid: !c.expiresAt || new Date(c.expiresAt)>=now, description:c.description||'' })) };
    }
    if (name === 'validate_coupon') {
      if (!C) return { valid:false, reason:'Không tìm thấy dữ liệu mã giảm giá.' };
      const code = String(args?.code||'').trim().toUpperCase();
      const c = await C.findOne({ code }).lean();
      if (!c) return { valid:false, reason:`Không tìm thấy mã ${code}.` };
      if (c.active===false) return { valid:false, reason:`Mã ${code} đang tắt.` };
      if (c.expiresAt && new Date(c.expiresAt) < new Date()) return { valid:false, reason:`Mã ${code} đã hết hạn.` };
      const total = Number(args?.orderTotal||0);
      if (c.minOrder && total && total < c.minOrder) return { valid:false, reason:`Mã ${code} cần đơn tối thiểu ${c.minOrder}đ.` };
      return { valid:true, code:c.code, type:c.type, value:c.value, minOrder:c.minOrder||0, maxDiscount:c.maxDiscount };
    }
    if (name === 'track_order') {
      if (!O) return { order:null };
      const id = String(args?.orderId||'').trim();
      const o = await O.findOne({ $or:[{ _id: mongoose.isValidObjectId(id)?id:undefined }, { orderId:id }, { code:id }].filter(x=>x&&Object.values(x)[0]) }).select('orderId code status paymentStatus total createdAt items').lean()
        || await O.findById(id).select('orderId code status paymentStatus total createdAt items').lean().catch(()=>null);
      return { order: o ? { id:String(o._id), code:o.orderId||o.code||String(o._id), status:o.status, paymentStatus:o.paymentStatus, total:o.total, createdAt:o.createdAt, items:(o.items||[]).slice(0,5).map(i=>({name:i.name,qty:i.quantity||i.qty,price:i.price})) } : null };
    }
    if (name === 'my_orders') {
      const user = getUserFromReq(req);
      if (!user?.id && !user?._id) return { requiresLogin:true, orders:[] };
      if (!O) return { orders:[] };
      const uid = user.id || user._id;
      const rows = await O.find({ $or:[{ user: uid }, { userId: uid }, { customer: uid }] }).sort({ createdAt:-1 }).limit(Math.min(5, Number(args?.limit)||5)).lean();
      return { requiresLogin:false, orders: rows.map(o=>({ id:String(o._id), code:o.orderId||o.code||String(o._id), status:o.status, paymentStatus:o.paymentStatus, total:o.total, createdAt:o.createdAt })) };
    }
    if (name === 'ui_action') {
      // validated/sanitized on backend, executed by frontend
      const a = String(args?.action||'');
      const allowed = new Set(['navigate','open_product','add_to_cart','open_cart','contact_support','my_orders']);
      if (!allowed.has(a)) return { ok:false };
      const action = { type:a };
      if (a==='navigate') action.path = String(args?.path||'/').startsWith('/') ? String(args.path) : '/';
      if (a==='open_product') action.slug = String(args?.slug||'');
      if (a==='add_to_cart') { action.productId = Number(args?.productId)||0; action.name = String(args?.name||'Sản phẩm'); action.quantity = Math.max(1, Number(args?.quantity)||1); }
      if (a==='open_cart') action.path='/gio-hang';
      if (a==='contact_support') action.path='/lien-he';
      if (a==='my_orders') action.path='/don-hang';
      return { ok:true, action };
    }
  } catch (e) { return { error: e.message }; }
  return { error: 'unknown tool' };
}

function fallbackText(question, ranked, actions=[], lang='vi') {
  const en = lang === 'en';
  const q = String(question||'').toLowerCase().normalize('NFC');
  if (/xin chào|hello|hi\b|chào/.test(q)) return en ? 'Hi! I am the Moc Mac Agent. I can help you find products, check prices, coupons, COD/VNPAY payment, track orders, and assist by opening pages or adding items to your cart.' : 'Chào bạn! Mình là Agent Mộc Mạc. Mình có thể giúp bạn tìm sản phẩm, xem giá, mã giảm giá, thanh toán COD/VNPAY, tra cứu đơn hàng, và hỗ trợ mở trang hoặc thêm sản phẩm vào giỏ.';
  if (/thanh toán|vnpay|cod|payment/.test(q)) return en ? 'Moc Mac supports Cash on Delivery (COD) and VNPAY (sandbox test). Add products to your cart, go to checkout, and choose a payment method.' : 'Mộc Mạc hỗ trợ thanh toán khi nhận hàng (COD) và VNPAY (sandbox test). Bạn thêm sản phẩm vào giỏ, sang bước đặt hàng và chọn phương thức phù hợp.';
  if (/liên hệ|hỗ trợ|admin|support|contact/.test(q)) return en ? 'You can open the Contact page or use the Support tab in this chat to message a Moc Mac admin directly.' : 'Bạn có thể vào trang Liên hệ hoặc dùng tab Hỗ trợ trong khung chat để nhắn trực tiếp quản trị viên Mộc Mạc.';
  const clean = (ranked||[]).map(c => c.replace(/^\[[^\]]+\]\s*/, '').replace(/^Sản phẩm:\s*/,'').trim()).filter(Boolean).slice(0,4);
  if (clean.length) return en ? `I found related information: ${clean.join('. ')}. Would you like details, a product page opened, or help adding an item to your cart?` : `Mình tìm được một số thông tin liên quan: ${clean.join('. ')}. Bạn muốn mình tư vấn chi tiết hơn, mở sản phẩm phù hợp hoặc thêm vào giỏ không?`;
  return en ? 'I do not have enough information to answer accurately yet. Please ask more specifically about a product name, price, region/craft village, coupon, payment, or order.' : 'Mình chưa có đủ dữ liệu để trả lời chính xác câu này. Bạn thử hỏi cụ thể hơn về tên sản phẩm, giá, vùng miền/làng nghề, mã giảm giá, thanh toán hoặc đơn hàng nhé.';
}

async function localAgent(question, ranked, req, lang='vi') {
  const en = lang === 'en';
  const q = String(question||'');
  const nq = norm(q);
  const actions = [];
  // coupon queries
  if (/mã|coupon|giảm giá|khuyen mai|khuyến mãi|discount|promo/.test(nq)) {
    const r = await runTool('list_coupons', {}, req);
    const valid = (r.coupons||[]).filter(c=>c.valid);
    if (!valid.length) return { text: en ? 'I do not see any active coupons right now. You can check again later or contact Moc Mac support.' : 'Hiện mình chưa thấy mã giảm giá đang hoạt động. Bạn có thể xem lại sau hoặc liên hệ Mộc Mạc để được hỗ trợ thêm.', actions };
    const lines = valid.slice(0,5).map(c=>`- ${c.code}: ${en?'save':'giảm'} ${c.type==='percent'||c.type==='percentage'?c.value+'%':(c.value||0).toLocaleString('vi-VN')+'đ'}${c.minOrder?`, ${en?'minimum order':'đơn tối thiểu'} ${Number(c.minOrder).toLocaleString('vi-VN')}đ`:''}`);
    return { text: (en ? 'Here are active coupons:\n' : 'Mình tìm thấy các mã giảm giá đang dùng được:\n') + lines.join('\n') + (en ? '\nYou can apply a code in your cart if the order qualifies.' : '\nBạn có thể áp mã ở bước giỏ hàng nếu đơn đủ điều kiện.'), actions };
  }
  // cart/navigation intents
  if (/mở giỏ|gio hang|giỏ hàng|xem giỏ|open cart|my cart/.test(nq)) { actions.push({type:'open_cart',path:'/gio-hang'}); return { text: en ? 'Opening your cart. You can review items and choose COD or VNPAY (sandbox test) at checkout.' : 'Mình mở giỏ hàng cho bạn nhé. Bạn có thể kiểm tra sản phẩm và chọn thanh toán COD hoặc VNPAY (sandbox test).', actions }; }
  if (/(liên hệ|ho tro|hỗ trợ|contact|support).*(mở|open|help|giúp)|mở.*(liên hệ|contact)/.test(nq)) { actions.push({type:'contact_support',path:'/lien-he'}); return { text: en ? 'Opening the Contact page. You can also use the Support tab in this chat to message an admin directly.' : 'Mình mở trang Liên hệ cho bạn. Nếu cần trao đổi trực tiếp, bạn cũng có thể dùng tab Hỗ trợ trong khung chat.', actions }; }
  if (/đơn hàng của tôi|don hang cua toi|xem đơn|my orders|open orders/.test(nq)) { actions.push({type:'my_orders',path:'/don-hang'}); return { text: en ? 'Opening your orders. If you are not logged in, you will be asked to sign in.' : 'Mình mở trang đơn hàng của bạn. Nếu chưa đăng nhập, hệ thống sẽ yêu cầu đăng nhập để xem đơn.', actions }; }
  if (/tra cứu|theo dõi đơn|ma don|mã đơn|track order|order id/.test(nq)) {
    const m = q.match(/[A-Z0-9]{6,}|[a-f0-9]{24}/i);
    if (m) { const r = await runTool('track_order',{orderId:m[0]},req); if (r.order) return { text: en ? `I found order ${r.order.code}: status ${r.order.status||'processing'}, payment ${r.order.paymentStatus||'unknown'}${r.order.total!=null?`, total ${Number(r.order.total).toLocaleString('vi-VN')}đ`:''}.` : `Mình tra được đơn ${r.order.code}: trạng thái ${r.order.status||'đang xử lý'}, thanh toán ${r.order.paymentStatus||'chưa rõ'}${r.order.total!=null?`, tổng ${Number(r.order.total).toLocaleString('vi-VN')}đ`:''}.`, actions }; return { text: en ? `I could not find an order with code "${m[0]}". Please check the code or use the order lookup page.` : `Mình chưa tìm thấy đơn với mã "${m[0]}". Bạn kiểm tra lại mã đơn hoặc vào trang Tra cứu đơn hàng giúp mình nhé.`, actions }; }
    actions.push({type:'my_orders',path:'/don-hang'});
    return { text: en ? 'To track an order, please send the order code. If it belongs to your account, I can also open your orders page.' : 'Để tra cứu đơn, bạn gửi mình mã đơn hàng (ví dụ mã trên trang đặt hàng). Nếu là đơn của tài khoản, mình cũng có thể mở mục Đơn hàng của bạn.', actions };
  }
  if (/thanh toán|vnpay|cod|payment|checkout/.test(nq)) return { text: en ? 'Moc Mac supports Cash on Delivery (COD) and VNPAY (sandbox test). Add items to your cart, proceed to checkout, and select your preferred method; VNPAY will redirect you to the payment gateway.' : 'Mộc Mạc hỗ trợ thanh toán khi nhận hàng (COD) và VNPAY (sandbox test). Bạn thêm sản phẩm vào giỏ, sang bước đặt hàng và chọn phương thức phù hợp; nếu chọn VNPAY, hệ thống sẽ chuyển bạn đến cổng thanh toán.', actions };
  // product search / add to cart
  const wantsAdd = /thêm.*giỏ|add.*cart|cho vào giỏ|mua/.test(nq);
  const productIntent = wantsAdd || /sản phẩm|tìm|gợi ý|nổi bật|trà|cà phê|bánh|đặc sản|giá|bao nhiêu|ocop|vùng/.test(nq);
  if (productIntent) {
    const stop = new Set(['tìm','cho','mình','giúp','và','thêm','vào','giỏ','sản','phẩm','nổi','bật','gợi','ý','muốn','mua','với','của','đang','bán','có','những','nào','bao','nhiêu','giá']);
    const terms = tokenize(q).filter(t=>!stop.has(t));
    const query = terms.join(' ') || ( /trà/.test(nq)?'trà':/cà phê|ca phe/.test(nq)?'cà phê':/bánh/.test(nq)?'bánh':'' );
    const r = query ? await runTool('search_products',{query,limit:6},req) : { items: [] };
    let items = r.items||[];
    if (!items.length) { const all = await runTool('search_products',{query:'a',limit:6},req); items = (all.items||[]).slice(0,5); }
    if (items.length) {
      const lines = items.slice(0,5).map(p=>`- ${p.name} (${Number(p.price).toLocaleString('vi-VN')}đ)${p.region?` — ${p.region}`:''}${p.ocop?`, OCOP ${p.ocop}`:''}`);
      const pick = items[0];
      if (wantsAdd && pick?.id) { actions.push({type:'add_to_cart', productId: pick.id, name: pick.name, quantity:1}); actions.push({type:'open_cart',path:'/gio-hang'}); }
      else if (pick?.slug) actions.push({type:'open_product', slug: pick.slug});
      return { text: wantsAdd && pick?.id
        ? `Mình tìm được ${pick.name}. Mình đã chuẩn bị thêm vào giỏ cho bạn (bấm nút bên dưới để xác nhận):\n${lines.join('\n')}`
        : `Mình gợi ý một vài sản phẩm phù hợp:\n${lines.join('\n')}\nBạn muốn mình thêm sản phẩm nào vào giỏ hoặc xem chi tiết không?`, actions };
    }
  }
  return { text: fallbackText(question, ranked, actions, lang), actions };
}

async function listGeminiModels(apiKey) {
  try {
    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}&pageSize=100`);
    const data = await resp.json().catch(()=>({}));
    if (!resp.ok) return [];
    return (data.models||[])
      .filter(m => (m.supportedGenerationMethods||[]).includes('generateContent') && /gemini/i.test(m.name||''))
      .map(m => String(m.name||'').replace(/^models\//,''));
  } catch { return []; }
}

async function geminiAgent(question, rankedChunks, req, lang='vi') {
  const apiKey = String(process.env.AI_API_KEY_CHAT_ASSISTANT || '').trim();
  if (!apiKey) return null;
  const configured = String(process.env.GEMINI_MODEL || '').trim();
  let models = [...new Set([configured, 'gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash'].filter(Boolean))];
  // if nothing worked before at runtime, try live discovery once
  const discovered = await listGeminiModels(apiKey).catch(()=>[]);
  if (discovered.length) {
    const preferred = discovered.filter(n => /flash/i.test(n) && !/image|tts|audio|embedding/i.test(n));
    models = [...new Set([configured, ...preferred, ...discovered, ...models].filter(Boolean))];
  }
  const context = rankedChunks.map((c, i) => `(${i+1}) ${c}`).join('\n');
  const langRule = lang === 'en' ? 'Reply in clear, friendly English.' : 'Trả lời bằng tiếng Việt tự nhiên, rõ ràng, thân thiện.';
  const system = `Bạn là Agent Mộc Mạc trên hệ thống web bán đặc sản làng nghề Việt Nam. Bạn vừa trò chuyện vừa có thể tra cứu DB và đề xuất hành động UI an toàn.
Quy tắc:
- ${langRule} KHÔNG trả JSON, KHÔNG dump slug/field/value thô.
- Cần dữ liệu chính xác thì gọi tool: search_products/get_product/list_coupons/validate_coupon/track_order/my_orders.
- Khách muốn mở trang/xem sản phẩm/thêm giỏ/mở giỏ/liên hệ/đơn hàng: gọi ui_action (chỉ an toàn, không xóa, không thanh toán tự động). add_to_cart phải có productId và name (tìm trước).
- Sau khi đã có đủ thông tin từ tool, HÃY trả lời người dùng bằng văn bản (không gọi thêm tool trừ khi thật sự cần). Ưu tiên trả lời sớm, ngắn gọn, hữu ích.
- Dữ liệu ngữ cảnh (chunk DB):\n${context || '(chưa có)'}`;
  const baseContents = [{ role:'user', parts:[{ text: `${system}\n\nKHÁCH: ${question}` }] }];
  const collectedActions = [];

  const callGemini = async (model, contents, withTools=true) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const body = { contents, generationConfig: { temperature: 0.5, maxOutputTokens: 900 } };
    if (withTools) { body.tools = [{ functionDeclarations: TOOLS }]; body.toolConfig = { functionCallingConfig: { mode: 'AUTO' } }; }
    const resp = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
    const data = await resp.json().catch(()=>({}));
    return { resp, data };
  };

  for (const model of models) {
    try {
      let localContents = baseContents.map(c=>JSON.parse(JSON.stringify(c)));
      let gotOk = false;
      for (let step=0; step<5; step++) {
        const { resp, data } = await callGemini(model, localContents, true);
        if (!resp.ok) { console.error('Gemini API error:', model, resp.status, data?.error?.message||data); break; }
        gotOk = true;
        const parts = data?.candidates?.[0]?.content?.parts || [];
        if (!parts.length) break;
        localContents.push({ role: 'model', parts });
        const calls = parts.filter(p => p.functionCall);
        const textNow = parts.filter(p => p.text).map(p=>p.text).join('').trim();
        if (!calls.length) return { text: textNow || null, actions: collectedActions };
        // execute tools; if model also returned text, keep it as fallback
        const fnResponses = [];
        for (const c of calls) {
          const fn = c.functionCall;
          const result = await runTool(fn.name, fn.args || {}, req);
          if (fn.name === 'ui_action' && result?.ok && result.action) collectedActions.push(result.action);
          fnResponses.push({ functionResponse: { name: fn.name, response: result } });
        }
        localContents.push({ role: 'user', parts: fnResponses });
        if (textNow && step >= 1) return { text: textNow, actions: collectedActions };
      }
      if (gotOk) {
        // force a final text answer without tools
        localContents.push({ role:'user', parts:[{ text: lang==='en' ? 'Based on the lookup results above, answer the customer in clear, friendly English. No tools, no JSON.' : 'Dựa trên kết quả tra cứu ở trên, hãy trả lời khách bằng tiếng Việt, tự nhiên và rõ ràng. Không gọi tool, không trả JSON.' }] });
        const { resp, data } = await callGemini(model, localContents, false);
        if (resp.ok) {
          const text = (data?.candidates?.[0]?.content?.parts||[]).map(p=>p.text||'').join('').trim();
          if (text) return { text, actions: collectedActions };
        }
        return collectedActions.length
          ? { text: 'Mình đã xử lý yêu cầu của bạn. Bạn có thể dùng các nút thao tác bên dưới nếu cần.', actions: collectedActions }
          : { text: fallbackText(question, rankedChunks, [], lang), actions: collectedActions };
      }
    } catch (e) { console.error('Gemini agent failed:', model, e?.message||e); }
  }
  return null;
}

const _tCache = new Map();
function tKey(text, target) { return `${target}::${text}`; }
function stripFences(s){ return String(s||'').replace(/^```[\w-]*\n?|```$/g,'').trim(); }

function localTranslateViToEn(text) {
  const s = String(text||'').replace(/\s+/g,' ').trim();
  if (!s) return s;
  // phrase-level deterministic translations (covers footer/common UI). longer/unknown text: keep or let Gemini handle when quota allows.
  const map = new Map([
    ['Về Mộc Mạc','About Moc Mac'],['Giới thiệu','About'],['Câu chuyện thương hiệu','Brand Story'],['Cam kết chất lượng','Quality Commitment'],['Tin tức','News'],['Tuyển dụng','Careers'],
    ['Hỗ trợ khách hàng','Customer Support'],['Hướng dẫn mua hàng','Shopping Guide'],['Phương thức thanh toán','Payment Methods'],['PHƯƠNG THỨC THANH TOÁN','PAYMENT METHODS'],
    ['Chính sách vận chuyển','Shipping Policy'],['Chính sách đổi trả','Return Policy'],['Câu hỏi thường gặp (FAQ)','Frequently Asked Questions (FAQ)'],['Câu hỏi thường gặp','Frequently Asked Questions'],['Liên hệ','Contact'],
    ['Danh mục','Categories'],['Sản phẩm','Products'],['Quà tặng','Gifts'],['Vùng miền','Regions'],['Làng nghề','Craft Villages'],['Dịch vụ','Services'],
    ['Đăng ký nhận tin','Subscribe to Newsletter'],['Nhận thông tin sản phẩm mới, ưu đãi và những câu chuyện văn hóa Việt từ Mộc Mạc.','Get new product updates, offers, and Vietnamese cultural stories from Moc Mac.'],
    ['✉ Nhập email của bạn','✉ Enter your email'],['Nhập email của bạn','Enter your email'],['Đăng ký','Subscribe'],['ĐĂNG KÝ','SUBSCRIBE'],
    ['ĐƠN VỊ VẬN CHUYỂN','SHIPPING PARTNERS'],['Đăng ký để nhận thông tin và ưu đãi','Subscribe for updates and offers'],['Nhập số điện thoại của bạn','Enter your phone number'],
    ['Tinh hoa Việt – Giá trị thật','Vietnamese Essence – True Value'],['Mộc Mạc mang đến những sản phẩm đặc sản và làng nghề Việt Nam,','Moc Mac brings Vietnamese specialty and craft-village products,'],['gìn giữ giá trị truyền thống và lan tỏa nét đẹp văn hóa Việt.','preserving traditional values and spreading the beauty of Vietnamese culture.'],
    ['© Công Ty Cổ Phần TM & DV Mộc Mạc.','© Moc Mac Trading & Services JSC.'],['669 Đỗ Mười, khu phố 13, phường Linh Xuân,','669 Do Muoi, Quarter 13, Linh Xuan Ward,'],['TP. Thủ Đức, TP. Hồ Chí Minh','Thu Duc City, Ho Chi Minh City'],
    ['Trang chủ','Home'],['Giỏ hàng','Cart'],['Thông báo','Notifications'],['Hỗ trợ','Support'],['Tài khoản','Account'],['Đăng nhập','Log in'],['Đăng xuất','Log out'],
  ]);
  if (map.has(s)) return map.get(s);
  // normalize spaces + common punctuation variants
  for (const [k,v] of map) if (s === k.replace(/\s+/g,' ').trim()) return v;
  // try partial brand line
  if (s.includes('Mộc Mạc') && s.length < 40) return s.replace(/Mộc Mạc/g,'Moc Mac');
  return null;
}

async function translateText(text, target='en') {
  const src = String(text||'').trim();
  if (!src) return '';
  const tgt = target === 'vi' ? 'vi' : 'en';
  if (tgt === 'vi') return src; // source content is primarily Vietnamese
  const key = tKey(src, tgt);
  if (_tCache.has(key)) return _tCache.get(key);
  const local = localTranslateViToEn(src);
  if (local) { _tCache.set(key, local); return local; }
  const apiKey = String(process.env.AI_API_KEY_CHAT_ASSISTANT || '').trim();
  if (!apiKey) return src;
  const configured = String(process.env.GEMINI_MODEL || 'gemini-2.5-flash').trim();
  const models = [...new Set([configured, 'gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-flash-latest'])];
  const prompt = `Translate the following Vietnamese e-commerce/content text into natural English. Keep meaning, tone, product names/brand (Mộc Mạc/Moc Mac) accurate. Return ONLY the translated text, no explanations.\n\nTEXT:\n${src}`;
  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const resp = await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contents:[{role:'user',parts:[{text:prompt}]}],generationConfig:{temperature:0.2,maxOutputTokens:1200}})});
      const data = await resp.json().catch(()=>({}));
      if (!resp.ok) { if (resp.status === 429) break; continue; }
      const out = stripFences((data?.candidates?.[0]?.content?.parts||[]).map(p=>p.text||'').join('').trim());
      if (out) { if (_tCache.size < 3000) _tCache.set(key,out); return out; }
    } catch {}
  }
  return local || src;
}

router.post('/translate', async (req, res) => {
  try {
    const target = String(req.body?.target || req.body?.lang || 'en').toLowerCase().startsWith('en') ? 'en' : 'vi';
    const texts = Array.isArray(req.body?.texts) ? req.body.texts : (req.body?.text != null ? [req.body.text] : []);
    const items = texts.slice(0, 60).map(t => String(t||'').slice(0, 2000));
    if (!items.length) return res.json({ translations: [], target });
    const translations = [];
    if (target === 'vi') { for (const t of items) translations.push(t); }
    else {
      for (const t of items) translations.push(await translateText(t, target));
    }
    return res.json({ translations, target });
  } catch (e) {
    console.error('AI translate error:', e);
    return res.status(500).json({ translations: (req.body?.texts||[]), target: req.body?.target||'en' });
  }
});

router.post('/chat', async (req, res) => {
  try {
    const question = String(req.body?.message || req.body?.question || '').trim();
    const lang = String(req.body?.lang || req.headers['x-lang'] || 'vi').toLowerCase().startsWith('en') ? 'en' : 'vi';
    if (!question) return res.status(400).json({ answer: lang==='en' ? 'Please enter a question.' : 'Vui lòng nhập câu hỏi.', actions: [] });

    const docs = await collectDocs();
    const allChunks = docs.flatMap(d => chunkText(d));
    const tokens = tokenize(question);
    const ranked = (tokens.length
      ? allChunks.map(c => ({ c, s: scoreChunk(c, tokens) })).filter(x => x.s > 0).sort((a,b)=>b.s-a.s)
      : allChunks.map((c,i)=>({ c, s: 1/(i+1) }))
    ).slice(0, MAX_CHUNKS).map(x => x.c);

    let answer = null, actions = [], provider = 'local';
    const p = String(process.env.AI_PROVIDER || 'gemini').toLowerCase();
    if (p === 'gemini' && process.env.AI_API_KEY_CHAT_ASSISTANT) {
      try {
        const out = await geminiAgent(question, ranked, req, lang);
        if (out?.text) { answer = out.text; actions = out.actions||[]; provider = 'gemini'; }
      } catch (e) { console.error('Gemini agent outer error:', e?.message||e); }
    }
    if (!answer) {
      const local = await localAgent(question, ranked, req, lang);
      answer = local.text; actions = actions.length ? actions : (local.actions||[]); provider = provider === 'gemini' ? 'local-fallback' : 'local';
    }

    return res.json({ answer, actions, provider, lang });
  } catch (e) {
    console.error('AI chat error:', e);
    return res.status(500).json({ answer: 'Trợ Lý AI gặp lỗi, vui lòng thử lại.', actions: [] });
  }
});

export default router;