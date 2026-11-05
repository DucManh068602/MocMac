import QRCode from 'qrcode';
import { Order } from '../models/Order.js';
import { Payment } from '../models/Payment.js';
import { Product } from '../models/Product.js';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4200';
const ROOT_QR_URL = process.env.ROOT_QR_URL || FRONTEND_URL;

export const getQr = async (req, res) => {
  try {
    const { type, id } = req.params;
    const format = String(req.query.format || 'png').toLowerCase();

    let text = '';
    if (type === 'order' || type === 'tracking') {
      const order = await Order.findById(id).lean();
      if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng.' });
      const code = order.orderId || id;
      text = `${FRONTEND_URL}/tra-cuu-don-hang/${code}`;
    } else if (type === 'payment') {
      const payment = await Payment.findById(id).populate('order').lean();
      if (!payment) return res.status(404).json({ success: false, message: 'Không tìm thấy thanh toán.' });
      const amount = payment.amount || payment.order?.total || 0;
      const code = payment.order?.orderId || id;
      text = `MOCMAC|${code}|${amount}|Thanh toan don hang ${code}`;
    } else if (type === 'product') {
      const product = await Product.findOne({ slug: id }).lean();
      if (!product) return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm.' });
      const base = String(ROOT_QR_URL || FRONTEND_URL).replace(/\/+$/, '');
      text = `${base}/san-pham/${product.slug}`;
    } else if (type === 'url') {
      text = String(req.query.url || '');
      if (!text) return res.status(400).json({ success: false, message: 'Thiếu url.' });
    } else {
      return res.status(400).json({ success: false, message: 'Loại QR không hỗ trợ.' });
    }

    if (format === 'json' || format === 'base64') {
      const dataUrl = await QRCode.toDataURL(text, { margin: 1, width: 300 });
      return res.json({ success: true, text, dataUrl });
    }

    const png = await QRCode.toBuffer(text, { type: 'png', margin: 1, width: 300 });
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=300');
    return res.send(png);
  } catch (error) {
    console.error('❌ Lỗi tạo QR:', error);
    return res.status(500).json({ success: false, message: 'Không thể tạo QR.', error: error.message });
  }
};
