import crypto from 'crypto';
import https from 'https';

const MOMO_CONFIG = {
  partnerCode: process.env.MOMO_PARTNER_CODE || 'MOMO',
  accessKey: process.env.MOMO_ACCESS_KEY || 'F8BBA842ECF85',
  secretKey: process.env.MOMO_SECRET_KEY || 'K951B6PE1waDMi640xX08PD3vg6EkVlz',
  endpoint: process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn',
  apiCreate: '/v2/gateway/api/create',
  notifyUrl: process.env.MOMO_NOTIFY_URL || 'https://callback.url/notify',
  redirectUrl: process.env.MOMO_REDIRECT_URL || 'https://momo.vn/return',
};

function generateSignature(amount, orderId, orderInfo, extraData, requestId, requestType) {
  const rawSignature =
    `accessKey=${MOMO_CONFIG.accessKey}` +
    `&amount=${amount}` +
    `&extraData=${extraData}` +
    `&ipnUrl=${MOMO_CONFIG.notifyUrl}` +
    `&orderId=${orderId}` +
    `&orderInfo=${orderInfo}` +
    `&partnerCode=${MOMO_CONFIG.partnerCode}` +
    `&redirectUrl=${MOMO_CONFIG.redirectUrl}` +
    `&requestId=${requestId}` +
    `&requestType=${requestType}`;

  return crypto.createHmac('sha256', MOMO_CONFIG.secretKey).update(rawSignature).digest('hex');
}

export function createMoMoPayment(amount, orderInfo, extraData = '', requestType = 'payWithMethod') {
  const requestId = `${MOMO_CONFIG.partnerCode}${Date.now()}`;
  const orderId = requestId;
  const signature = generateSignature(amount, orderId, orderInfo, extraData, requestId, requestType);

  return {
    partnerCode: MOMO_CONFIG.partnerCode,
    accessKey: MOMO_CONFIG.accessKey,
    requestId,
    amount: String(amount),
    orderId,
    orderInfo,
    redirectUrl: MOMO_CONFIG.redirectUrl,
    ipnUrl: MOMO_CONFIG.notifyUrl,
    extraData,
    requestType,
    signature,
    lang: 'vi',
  };
}

export async function callMoMoApi(payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const parsed = new URL(MOMO_CONFIG.endpoint);

    const options = {
      hostname: parsed.hostname,
      port: 443,
      path: `${MOMO_CONFIG.apiCreate}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch { resolve(data); }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}
