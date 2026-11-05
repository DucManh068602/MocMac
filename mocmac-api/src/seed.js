import 'dotenv/config';
import fs from 'node:fs';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

import { Product } from './models/Product.js';
import { User } from './models/User.js';
import { Region } from './models/Region.js';
import { slugify } from './utils/slugify.js';
import { Permission } from './models/Permission.js';
import { RolePermission } from './models/RolePermission.js';

const raw = JSON.parse(
  fs.readFileSync(
    new URL('../../my-app/public/data/product.json', import.meta.url),
    'utf8'
  )
);

await mongoose.connect(process.env.MONGODB_URI);

console.log('Đã kết nối MongoDB');

// =======================
// PRODUCTS
// =======================

const provinceToRegion = {
  'Hà Nội': 'Đồng bằng sông Hồng',
  'Hà Nam': 'Đồng bằng sông Hồng',
  'Hải Dương': 'Đông Bắc',
  'Bắc Ninh': 'Đông Bắc',
  'Hà Giang': 'Đông Bắc',
  'Thái Nguyên': 'Đông Bắc',
  'Sơn La': 'Tây Bắc',
  'Điện Biên': 'Tây Bắc',
  'Lâm Đồng': 'Tây Nguyên',
  'Đắk Lắk': 'Tây Nguyên',
  'Gia Lai': 'Tây Nguyên',
  'Ninh Thuận': 'Duyên hải Nam Trung Bộ',
  'Thừa Thiên Huế': 'Bắc Trung Bộ',
  'Quảng Nam': 'Duyên hải Nam Trung Bộ',
  'Bình Dương': 'Đông Nam Bộ',
  'Bình Phước': 'Đông Nam Bộ',
  'TP. Hồ Chí Minh': 'Đông Nam Bộ',
  'Tây Ninh': 'Đông Nam Bộ',
  'An Giang': 'Tây Nam Bộ',
};

const products = raw.map((product) => ({
  ...product,
  region: provinceToRegion[product.province] ?? product.region,
  slug: slugify(product.name),
  village: product.village ?? '',
  occasion: Array.isArray(product.occasion)
    ? product.occasion
    : product.occasion
      ? [product.occasion]
      : [],
}));

// Make slugs unique: append product id when collisions occur
const seen = new Set();
products.forEach((p) => {
  let s = p.slug;
  if (seen.has(s)) {
    s = `${s}-${p.id}`;
  }
  seen.add(s);
  p.slug = s;
});

await Product.deleteMany({});
await Product.insertMany(products, { ordered: false });

console.log(`Đã nạp ${products.length} sản phẩm`);

// =======================
// REGIONS (quét từ trang chủ)
// =======================

const regionsData = [
  { name: 'Tây Bắc', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRxpyJhyXB5BQzAtOHwlylJZHMsfoghqPlrCKbZAyZ9ow&s=10' },
  { name: 'Đông Bắc', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSQWRIh9tStHZYCwUvvCGPqVVfmX-xuVgBuoIdxeUkzQg&s=10' },
  { name: 'Đồng bằng sông Hồng', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSNWSaIAJETm8_NoEhTSPruVE3glshosFGwJfbUy4g5bw&s=10' },
  { name: 'Bắc Trung Bộ', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRHYlICpRLMbmCq-P99jHBxUgrwIseVCYoAlJPUiK2Mlw&s=10' },
  { name: 'Duyên hải Nam Trung Bộ', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR4po6kiK1CzC8qZCzsG_MzfZNrOEuS_iYCk9MeTQ5-Pg&s=10' },
  { name: 'Tây Nguyên', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQyJJlk2Tg2KiFkg6prQa1HdWgkD5U5BQGvKJ52ihMFQQ&s=10' },
  { name: 'Đông Nam Bộ', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTuoSgjLgOLcsThMSOj2b3TwMbIdRh4aUGLsN0gV3phmw&s=10' },
  { name: 'Tây Nam Bộ', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRy5j3zhx-l9D1GbNgZCiiw_H3lf589GhLHwlH7UH7ICg&s=10' },
];

const regionDescs = {
  'Tây Bắc': 'Vùng cao nguyên miền Bắc với khí hậu mát mẻ, nổi tiếng với đồng hồ cát, rau má, tiêu.',
  'Đông Bắc': 'Vùng đồng bằng phía đông của miền Bắc, giàu truyền thống nông nghiệp và công nghiệp.',
  'Đồng bằng sông Hồng': 'Trái tim kinh tế của Việt Nam với đất đai màu mỏng bờ kè, lúa gạo nổi tiếng.',
  'Bắc Trung Bộ': 'Bờ cảng biển tươi mát với văn hóa lịch sử hùng mỵ, đặc sản hải sản và rau củ.',
  'Duyên hải Nam Trung Bộ': 'Dải đông bờ biển với những bãi biển hoang sơ và nghề mộc, gỗ truyền thống.',
  'Tây Nguyên': 'Vùng đất cao với khí hậu se lạnh, nổi tiếng với cà phê, cao su và nông sản.',
  'Đông Nam Bộ': 'Vùng đất mỏng với khí hậu nhiệt đới, nổi tiếng với trái cây và thủ công mỹ nghệ.',
  'Tây Nam Bộ': 'Vùng đồng bằng với hệ thống kênh rạch, nổi tiếng với trái cây và mặn.',
};

const regions = regionsData.map((r) => ({
  name: r.name,
  slug: slugify(r.name),
  image: r.image,
  description: regionDescs[r.name] ?? '',
}));

await Region.deleteMany({});
await Region.insertMany(regions, { ordered: false });

const regionCounts = regionsData.map((r) => {
  const count = products.filter((p) => p.region === r.name).length;
  return { name: r.name, productCount: count };
});
await Promise.all(
  regionCounts.map((rc) =>
    Region.updateOne({ name: rc.name }, { productCount: rc.productCount })
  )
);

console.log(`Đã nạp ${regions.length} vùng miền (${regionCounts.map(r => `${r.name}: ${r.productCount}`).join(', ')})`);

// =======================
// ADMIN
// =======================

const adminEmail = (
  process.env.ADMIN_EMAIL ?? 'admin@admin.mocmac.vn'
).toLowerCase();

if (!(await User.exists({ email: adminEmail }))) {

  const passwordHash = await bcrypt.hash(
    process.env.ADMIN_PASSWORD ?? 'Admin@12345',
    10
  );

  await User.create({
    name: 'Quản trị viên',
    email: adminEmail,
    phone: '0123456789',
    passwordHash,
    role: 'admin',
  });

  console.log(`Đã tạo admin: ${adminEmail}`);
}

// =======================
// STAFF
// =======================

const staffEmail = (
  process.env.STAFF_EMAIL ?? 'staff@mocmac.vn'
).toLowerCase();

if (!(await User.exists({ email: staffEmail }))) {

  const passwordHash = await bcrypt.hash(
    process.env.STAFF_PASSWORD ?? 'Staff@12345',
    10
  );

  await User.create({
    name: 'Nhân viên Mộc Mạc',
    email: staffEmail,
    passwordHash,
    role: 'staff',
  });

  console.log(`Đã tạo staff: ${staffEmail}`);
}

// =======================
// PERMISSIONS & ROLE PERMISSIONS
// =======================

const defaultPermissions = [
  { name: 'auth.me', description: 'Xem thông tin cá nhân của mình', category: 'auth', action: 'view', isSystem: true },
  { name: 'auth.forgot-password', description: 'Quên mật khẩu cá nhân', category: 'auth', action: 'manage', isSystem: true },
  { name: 'users.view', description: 'Xem danh sách người dùng', category: 'users', action: 'view', isSystem: true },
  { name: 'users.create', description: 'Tạo tài khoản mới', category: 'users', action: 'create', isSystem: true },
  { name: 'users.update', description: 'Cập nhật / kích hoạt / khóa tài khoản', category: 'users', action: 'update', isSystem: true },
  { name: 'users.delete', description: 'Xóa tài khoản', category: 'users', action: 'delete', isSystem: true },
  { name: 'products.view', description: 'Xem danh sách sản phẩm', category: 'products', action: 'view', isSystem: true },
  { name: 'products.create', description: 'Tạo sản phẩm', category: 'products', action: 'create', isSystem: true },
  { name: 'products.update', description: 'Cập nhật sản phẩm', category: 'products', action: 'update', isSystem: true },
  { name: 'products.delete', description: 'Xóa sản phẩm', category: 'products', action: 'delete', isSystem: true },
  { name: 'orders.view', description: 'Xem danh sách đơn hàng', category: 'orders', action: 'view', isSystem: true },
  { name: 'orders.create', description: 'Tạo đơn hàng', category: 'orders', action: 'create', isSystem: true },
  { name: 'orders.update', description: 'Cập nhật trạng thái đơn hàng / thanh toán', category: 'orders', action: 'update', isSystem: true },
  { name: 'orders.delete', description: 'Xóa đơn hàng', category: 'orders', action: 'delete', isSystem: true },
  { name: 'contacts.view', description: 'Xem danh sách tin nhắn liên hệ', category: 'contacts', action: 'view', isSystem: true },
  { name: 'contacts.update', description: 'Cập nhật / trả lời tin nhắn liên hệ', category: 'contacts', action: 'update', isSystem: true },
  { name: 'reviews.view', description: 'Xem đánh giá sản phẩm', category: 'reviews', action: 'view', isSystem: true },
  { name: 'reviews.update', description: 'Cập nhật / ẩn / xóa đánh giá', category: 'reviews', action: 'update', isSystem: true },
  { name: 'coupons.view', description: 'Xem danh sách mã giảm giá', category: 'coupons', action: 'view', isSystem: true },
  { name: 'coupons.create', description: 'Tạo mã giảm giá', category: 'coupons', action: 'create', isSystem: true },
  { name: 'coupons.update', description: 'Cập nhật / xóa mã giảm giá', category: 'coupons', action: 'update', isSystem: true },
  { name: 'role-requests.view', description: 'Xem danh sách yêu cầu nâng cấp vai trò', category: 'role-requests', action: 'view', isSystem: true },
  { name: 'role-requests.create', description: 'Tạo yêu cầu nâng cấp vai trò', category: 'role-requests', action: 'create', isSystem: true },
  { name: 'role-requests.update', description: 'Duyệt / từ chối yêu cầu nâng cấp vai trò', category: 'role-requests', action: 'update', isSystem: true },
  { name: 'audit.view', description: 'Xem lịch sử hệ thống', category: 'audit', action: 'view', isSystem: true },
  { name: 'audit.create', description: 'Ghi nhận hành động hệ thống', category: 'audit', action: 'create', isSystem: true },
  { name: 'audit.delete', description: 'Xóa lịch sử hệ thống', category: 'audit', action: 'delete', isSystem: true },
  { name: 'notifications.view', description: 'Xem thông báo', category: 'notifications', action: 'view', isSystem: true },
  { name: 'notifications.create', description: 'Tạo / gửi thông báo', category: 'notifications', action: 'create', isSystem: true },
  { name: 'notifications.update', description: 'Đánh dấu / cập nhật thông báo', category: 'notifications', action: 'update', isSystem: true },
];

const permissionDocs = await Permission.insertMany(defaultPermissions);

const rolePermissionDefs = [
  // Admin: toàn bộ quyền hệ thống
  { role: 'admin', permissionName: 'admin.system', description: 'Quyền quản trị hệ thống' },
  { role: 'admin', permissionName: 'admin.manage', description: 'Quyền quản trị toàn bộ' },
];

// Gán tất cả permission hệ thống cho admin
for (const p of permissionDocs) {
  await RolePermission.findOneAndUpdate(
    { role: 'admin', permission: p._id },
    { assignedBy: null, assignedAt: new Date(), notes: 'Auto-assign full' },
    { upsert: true }
  );
}

// Staff: quyền vận hành bán hàng
for (const p of permissionDocs) {
  const allowed =
    p.category === 'products' ||
    p.category === 'orders' ||
    p.category === 'contacts' ||
    p.category === 'reviews' ||
    p.category === 'coupons' ||
    p.category === 'notifications' ||
    p.category === 'auth';
  if (allowed) {
    await RolePermission.findOneAndUpdate(
      { role: 'staff', permission: p._id },
      { assignedBy: null, assignedAt: new Date(), notes: 'Auto-assign operational' },
      { upsert: true }
    );
  }
}

// Collaborator: chỉ xem sản phẩm, nộp đánh giá
for (const p of permissionDocs) {
  const allowed = ['products.view', 'reviews.create', 'auth.me'].includes(p.name);
  if (allowed) {
    await RolePermission.findOneAndUpdate(
      { role: 'collaborator', permission: p._id },
      { assignedBy: null, assignedAt: new Date(), notes: 'Auto-assign collaboration' },
      { upsert: true }
    );
  }
}

// Cooperative: xem sản phẩm và theo dõi đơn hàng
for (const p of permissionDocs) {
  const allowed = ['products.view', 'orders.view', 'auth.me'].includes(p.name);
  if (allowed) {
    await RolePermission.findOneAndUpdate(
      { role: 'cooperative', permission: p._id },
      { assignedBy: null, assignedAt: new Date(), notes: 'Auto-assign business' },
      { upsert: true }
    );
  }
}

// Customer: chỉ xem sản phẩm
for (const p of permissionDocs) {
  const allowed = ['products.view', 'auth.me', 'auth.forgot-password'].includes(p.name);
  if (allowed) {
    await RolePermission.findOneAndUpdate(
      { role: 'customer', permission: p._id },
      { assignedBy: null, assignedAt: new Date(), notes: 'Auto-assign customer' },
      { upsert: true }
    );
  }
}

console.log(`Đã nạp ${permissionDocs.length} permission và gán cho các vai trò`);

await mongoose.disconnect();

console.log('Seed hoàn tất');