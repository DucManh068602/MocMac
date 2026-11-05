import crypto from 'crypto';

function formatDate(date) {
  const pad = (n) => String(n).padStart(2, '0');
  const d = new Date(date);
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function sortObject(obj) {
  return Object.keys(obj).sort().reduce((acc, key) => { acc[key] = obj[key]; return acc; }, {});
}

function enc(v) { return encodeURIComponent(String(v)).replace(/%20/g, '+'); }
function buildQuery(obj) { return Object.keys(obj).map(k => `${enc(k)}=${enc(obj[k])}`).join('&'); }

export function buildVnpayPaymentUrl({ amount, orderId, orderInfo, ipAddr = '127.0.0.1', locale = 'vn', bankCode = '' }) {
  const tmnCode = String(process.env.VNPAY_TMN_CODE || '').trim();
  const secretKey = String(process.env.VNPAY_HASH_SECRET || '').trim();
  const vnpUrl = String(process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html').trim();
  const returnUrl = String(process.env.VNPAY_RETURN_URL || (process.env.FRONTEND_URL||'http://localhost:4200').replace(/\s+/g,'').replace(/\/+$/,'') + '/gio-hang').trim();
  const createDate = formatDate(new Date());
  const expire = new Date(Date.now() + 15 * 60 * 1000);
  const vnp_Params = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: tmnCode,
    vnp_Locale: locale || 'vn',
    vnp_CurrCode: 'VND',
    vnp_TxnRef: String(orderId),
    vnp_OrderInfo: String(orderInfo || `Thanh toan don hang ${orderId}`).replace(/[#&?]/g, ' ').slice(0,255),
    vnp_OrderType: 'other',
    vnp_Amount: Math.round(Number(amount) * 100),
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: ipAddr || '127.0.0.1',
    vnp_CreateDate: createDate,
    vnp_ExpireDate: formatDate(expire),
  };
  if (bankCode) vnp_Params.vnp_BankCode = bankCode;
  const sorted = sortObject(vnp_Params);
  const signData = buildQuery(sorted);
  const signed = crypto.createHmac('sha512', secretKey).update(Buffer.from(signData, 'utf-8')).digest('hex');
  sorted.vnp_SecureHash = signed;
  return { url: `${vnpUrl}?${buildQuery(sorted)}`, txnRef: vnp_Params.vnp_TxnRef };
}

export function verifyVnpayReturn(query = {}) {
  const secretKey = String(process.env.VNPAY_HASH_SECRET || '').trim();
  const vnp_Params = { ...query };
  const secureHash = vnp_Params.vnp_SecureHash || '';
  delete vnp_Params.vnp_SecureHash;
  delete vnp_Params.vnp_SecureHashType;
  const sorted = sortObject(vnp_Params);
  const signData = buildQuery(sorted);
  const signed = crypto.createHmac('sha512', secretKey).update(Buffer.from(signData, 'utf-8')).digest('hex');
  const ok = !!secretKey && !!secureHash && signed.toLowerCase() === String(secureHash).toLowerCase();
  return { ok, code: vnp_Params.vnp_ResponseCode, txnRef: vnp_Params.vnp_TxnRef, transNo: vnp_Params.vnp_TransactionNo, params: vnp_Params };
}
