import { Injectable, computed, signal } from '@angular/core';

export type Lang = 'vi' | 'en';

const DICT: Record<Lang, Record<string, string>> = {
  vi: {
    'nav.home': 'Trang chủ', 'nav.products': 'Sản phẩm', 'nav.gifts': 'Quà tặng', 'nav.regions': 'Vùng miền', 'nav.villages': 'Làng nghề', 'nav.contact': 'Liên hệ',
    'top.about': 'Giới thiệu', 'top.giftNeeds': 'Quà tặng theo nhu cầu', 'top.giftBusiness': 'Quà tặng doanh nghiệp', 'top.notifications': 'Thông báo', 'top.support': 'Hỗ trợ', 'top.account': 'Tài khoản',
    'search.placeholder': 'Tìm đặc sản, làng nghề, vùng miền...', 'cart.label': 'Giỏ hàng', 'cart.aria': 'Giỏ hàng',
    'account.myOrders': 'Đơn hàng của tôi', 'account.myGifts': 'Quà tặng đã mua', 'account.admin': 'Trang quản trị', 'account.settings': 'Cài đặt tài khoản', 'account.logout': 'Đăng xuất',
    'login.title': 'Bạn cần đăng nhập', 'login.text': 'Để mua hàng và quản lý giỏ hàng, vui lòng đăng nhập tài khoản.', 'login.action': 'Đăng nhập ngay', 'login.cancel': 'Hủy',
    'agent.title': 'Agent Mộc Mạc', 'agent.status': 'Tư vấn & thao tác hỗ trợ', 'agent.tab': 'Agent', 'agent.supportTab': 'Hỗ trợ', 'agent.welcome': 'Mình có thể tư vấn, tra cứu dữ liệu Mộc Mạc và hỗ trợ mở trang hoặc thêm sản phẩm vào giỏ.',
    'agent.placeholder': 'Nhờ Agent tư vấn, tìm sản phẩm, thêm giỏ...', 'agent.supportPlaceholder': 'Nhắn cho quản trị viên...', 'agent.tip': 'Trợ Lý AI', 'agent.hello': 'Chào bạn! Mình là Agent Mộc Mạc — mình có thể tư vấn sản phẩm, tra mã giảm giá/đơn hàng, và hỗ trợ mở trang hoặc thêm sản phẩm vào giỏ giúp bạn.',
    'lang.vi': 'Tiếng Việt', 'lang.en': 'English',
  },
  en: {
    'nav.home': 'Home', 'nav.products': 'Products', 'nav.gifts': 'Gifts', 'nav.regions': 'Regions', 'nav.villages': 'Craft Villages', 'nav.contact': 'Contact',
    'top.about': 'About', 'top.giftNeeds': 'Gifts by Need', 'top.giftBusiness': 'Corporate Gifts', 'top.notifications': 'Notifications', 'top.support': 'Support', 'top.account': 'Account',
    'search.placeholder': 'Search specialties, craft villages, regions...', 'cart.label': 'Cart', 'cart.aria': 'Cart',
    'account.myOrders': 'My Orders', 'account.myGifts': 'Purchased gifts', 'account.admin': 'Admin', 'account.settings': 'Account Settings', 'account.logout': 'Log out',
    'login.title': 'Login required', 'login.text': 'Please log in to shop and manage your cart.', 'login.action': 'Log in now', 'login.cancel': 'Cancel',
    'agent.title': 'Moc Mac Agent', 'agent.status': 'Advice & assisted actions', 'agent.tab': 'Agent', 'agent.supportTab': 'Support', 'agent.welcome': 'I can advise, look up Moc Mac data, and help open pages or add products to your cart.',
    'agent.placeholder': 'Ask the agent to find products, add to cart...', 'agent.supportPlaceholder': 'Message an admin...', 'agent.tip': 'AI Assistant', 'agent.hello': 'Hi! I am the Moc Mac Agent — I can help with products, coupons/orders, and assist by opening pages or adding items to your cart.',
    'pd.desc': 'Description', 'pd.info': 'Details', 'pd.reviews': 'Reviews', 'pd.addCart': 'Add to cart', 'pd.buyNow': 'Buy now', 'pd.share': 'Share', 'pd.origin': 'Origin', 'pd.village': 'Craft village', 'pd.region': 'Region', 'pd.status': 'Availability', 'pd.inStock': '● In stock', 'pd.preorder': '● Pre-order', 'pd.outStock': '● Out of stock', 'pd.related': 'You may also like', 'pd.back': '← Back to products', 'pd.notFound': 'Product not found', 'pd.loading': 'Loading product...', 'pd.translating': 'Translating content...',
    'lang.vi': 'Tiếng Việt', 'lang.en': 'English',
  },
};

@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly lang = signal<Lang>((localStorage.getItem('mocmac-lang') as Lang) || 'vi');
  readonly locale = computed(() => (this.lang() === 'en' ? 'en-US' : 'vi-VN'));

  constructor() { document.documentElement.lang = this.lang(); }

  t(key: string): string {
    const l = this.lang();
    return DICT[l]?.[key] || DICT.vi[key] || key;
  }

  setLang(lang: Lang): void {
    if (lang !== 'vi' && lang !== 'en') return;
    this.lang.set(lang);
    localStorage.setItem('mocmac-lang', lang);
    document.documentElement.lang = lang;
    window.dispatchEvent(new CustomEvent('mocmac-lang-change', { detail: lang }));
  }

  toggle(): void { this.setLang(this.lang() === 'vi' ? 'en' : 'vi'); }
}
