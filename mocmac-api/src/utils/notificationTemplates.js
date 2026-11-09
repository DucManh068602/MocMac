export const NOTIFICATION_TEMPLATES = [
  {
    key: 'welcome_new_user',
    type: 'system',
    title: 'Chào mừng bạn đến với Mộc Mạc',
    content: 'Tài khoản của bạn đã được kích hoạt. Hãy khám phá đặc sản, làng nghề và tạo yêu cầu báo giá quà tặng đầu tiên ngay hôm nay.',
    link: '/san-pham',
    description: 'Gửi ngay sau khi khách hàng xác thực OTP và kích hoạt tài khoản thành công.',
  },
  {
    key: 'order_confirmed',
    type: 'order',
    title: 'Đơn hàng của bạn đã được xác nhận',
    content: 'Chúng tôi đã nhận đơn hàng #{{orderCode}} của bạn. Nhân viên sẽ xử lý và giao hàng trong thời gian sớm nhất. Bạn có thể theo dõi trạng thái đơn hàng tại mục Đơn hàng của tôi.',
    link: '/don-hang',
    description: 'Gửi khi đơn hàng của khách hàng được cập nhật trạng thái sang đã xác nhận/đang xử lý.',
    vars: ['orderCode'],
  },
  {
    key: 'quotation_accepted',
    type: 'system',
    title: 'Báo giá quà tặng của bạn đã được đồng ý',
    content: 'Yêu cầu báo giá quà tặng #{{quoteCode}} của bạn đã được cửa hàng chấp nhận. Chúng tôi sẽ chuẩn bị gói quà và liên hệ giao hàng đến bạn. Thanh toán COD hoặc chuyển khoản ngân hàng.',
    link: '/quà-tang-đã-mua',
    description: 'Gửi khi admin chấp nhận báo giá quà tặng của khách hàng.',
    vars: ['quoteCode'],
  },
  {
    key: 'tier_upgraded',
    type: 'system',
    title: 'Chúc mừng bạn đã nâng hạng hội viên',
    content: 'Bạn đã đạt hạng {{tierName}} tại Mộc Mạc. Thưởng nhận giảm giá tự động {{discountPercent}}%, miễn phí vận chuyển và ưu tiên hỗ trợ báo giá quà tặng.',
    link: '/tai-khoan',
    description: 'Gửi khi khách hàng tích lũy chi tiêu đủ điều kiện lên hạng cao hơn.',
    vars: ['tierName', 'discountPercent'],
  },
  {
    key: 'promo_coupon',
    type: 'promo',
    title: 'Ưu đãi tháng này chỉ dành cho bạn',
    content: 'Sử dụng mã {{couponCode}} để giảm {{discountValue}} trên đơn hàng tiếp theo tại Mộc Mạc. Hân hạnh được phục vụ quý khách!',
    link: '/san-pham',
    description: 'Gửi mã giảm giá / khuyến mãi riêng cho khách hàng hoặc hạng hội viên.',
    vars: ['couponCode', 'discountValue'],
  },
];

export const render = (template, vars = {}) => {
  let content = template.content;
  for (const [k, v] of Object.entries(vars || {})) {
    content = content.replace(new RegExp(`{{${k}}}`, 'g'), String(v || ''));
  }
  return {
    key: template.key,
    type: template.type,
    title: template.title,
    content,
    link: template.link,
    description: template.description,
  };
};

export const findTemplate = (key) => NOTIFICATION_TEMPLATES.find((t) => t.key === key) || null;
