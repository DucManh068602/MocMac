import 'dotenv/config';
import fs from 'node:fs';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

import { Product } from './models/Product.js';
import { User } from './models/User.js';
import { Region } from './models/Region.js';
import { RegionStory } from './models/RegionStory.js';
import { VillageStory } from './models/VillageStory.js';
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
  stock: 100,
  totalStock: 100,
  inStock: true,
  sold: 0,
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

// =======================
// STORIES (region + village)
// =======================
const regionStories = [
  { title: 'Tây Nguyên – Hương cà phê giữa đại ngàn', region: 'Tây Nguyên', excerpt: 'Đất bazan đỏ và khí hậu cao nguyên tạo nên hạt cà phê đậm vị, mang theo nhịp sống mộc mạc của buôn làng.', content: '<p>Tây Nguyên được xem là thủ phủ cà phê của Việt Nam với những nương rẫy trải dài trên nền đất bazan màu mỡ. Từ Buôn Ma Thuột đến Đà Lạt, từng hạt cà phê được chăm sóc qua nhiều mùa nắng gió, rang xay giữ trọn hương thơm nồng nàn.</p><p>Khi chọn một gói cà phê Tây Nguyên làm quà, bạn đang gửi trao dư vị của đại ngàn, sự chân chất và câu chuyện về những người nông dân miệt mài gìn giữ nghề.</p>', imageUrl: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1200&q=80', status: 'published', order: 10 },
  { title: 'Đồng bằng sông Hồng – Nơi làng nghề dệt nên ký ức', region: 'Đồng bằng sông Hồng', excerpt: 'Từ lò gốm Bát Tràng đến khung cửi Vạn Phúc, vùng đất này lưu giữ tinh hoa thủ công truyền thống.', content: '<p>Đồng bằng sông Hồng là cái nôi của nhiều làng nghề lâu đời. Nghệ nhân nơi đây biến đất sét thành gốm men tinh tế, biến sợi tơ thành tấm lụa mềm mại, biến mây tre thành sản phẩm hữu dụng.</p><p>Mỗi món quà thủ công từ vùng này không chỉ đẹp ở hình thức mà còn chứa đựng kỹ thuật truyền dạy qua nhiều thế hệ — một cách gửi tặng bản sắc Việt thật gần gũi.</p>', imageUrl: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=1200&q=80', status: 'published', order: 9 },
  { title: 'Tây Bắc – Vị trà cổ thụ và sắc thổ cẩm', region: 'Tây Bắc', excerpt: 'Sương sớm trên núi cao ươm búp trà Shan Tuyết, trong khi bàn tay người thợ dệt nên hoa văn thổ cẩm độc bản.', content: '<p>Tây Bắc gây thương nhớ bởi những cây chè cổ thụ mọc giữa mây ngàn Hà Giang, Sơn La. Búp trà được hái thủ công, giữ vị chát dịu và hậu ngọt sâu.</p><p>Song hành cùng trà là nghề dệt thổ cẩm với hoa văn mang ý nghĩa văn hóa của từng cộng đồng. Một set quà kết hợp trà và sản phẩm thủ công Tây Bắc là lời chúc bình an, đậm đà bản địa.</p>', imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=1200&q=80', status: 'published', order: 8 },
  { title: 'Duyên hải Nam Trung Bộ – Quà từ nắng, gió và biển', region: 'Duyên hải Nam Trung Bộ', excerpt: 'Vùng biển đầy nắng gió đóng góp những đặc sản đậm đà, gói trọn tinh thần hiếu khách của miền Trung.', content: '<p>Duyên hải Nam Trung Bộ nổi bật với sản vật từ biển và nghề chế biến truyền thống. Từ những mẻ cá, mẻ mắm được ủ kỹ đến các sản phẩm thủ công ven biển, mỗi món quà mang theo vị mặn mòi của gió biển.</p><p>Đây là lựa chọn phù hợp cho những ai muốn gửi tặng hương vị chân thật, mạnh mẽ của miền Trung.</p>', imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80', status: 'published', order: 7 },
  { title: 'Tây Nam Bộ – Miệt vườn trù phú, quà ngọt hậu', region: 'Tây Nam Bộ', excerpt: 'Sông nước và vườn trái cây bốn mùa tạo nên những món quà dân dã, tròn vị mà gần gũi.', content: '<p>Tây Nam Bộ hiền hòa với kênh rạch chằng chịt, vườn cây trái sum suê. Đặc sản miền sông nước thường mang vị ngọt thanh, thơm tự nhiên và tinh thần phóng khoáng của con người Nam Bộ.</p><p>Gói quà từ vùng đất này phù hợp cho dịp thăm hỏi, biếu tặng — giản dị nhưng đầy tình.</p>', imageUrl: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80', status: 'published', order: 6 },
];
const villageStories = [
  { title: 'Bát Tràng – Từ bàn xoay đến lò lửa', village: 'Bát Tràng', province: 'Hà Nội', craft: 'Gốm', excerpt: 'Mỗi bộ ấm chén là kết tinh của đất, men và kinh nghiệm nung lửa truyền đời.', content: '<p>Làng gốm Bát Tràng nổi tiếng với sản phẩm gốm sứ tinh xảo. Người thợ nhào nặn đất, tạo hình trên bàn xoay, phủ men và canh lửa trong lò — mỗi công đoạn đều cần sự kiên nhẫn.</p><p>Quà tặng từ Bát Tràng mang vẻ đẹp mộc mạc mà sang trọng, thích hợp cho biếu tặng và không gian sum vầy. Từ ấm chén, bình hoa đến đồ trang trí, mỗi sản phẩm đều kể câu chuyện về đôi bàn tay người thợ và truyền thống hàng trăm năm.</p>', imageUrl: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=1200&q=80', status: 'published', order: 10 },
  { title: 'Vạn Phúc – Hơi thở của lụa tơ tằm', village: 'Vạn Phúc', province: 'Hà Nội', craft: 'Dệt lụa', excerpt: 'Những thước lụa mềm mại mang theo kỹ thuật dệt và thẩm mỹ được gìn giữ qua nhiều thế hệ.', content: '<p>Làng lụa Vạn Phúc (Hà Đông, Hà Nội) gắn với nghề dệt lụa tơ tằm lâu đời. Từ khâu ươm tơ, nhuộm màu đến dệt hoa văn, mỗi công đoạn đòi hỏi sự tỉ mỉ và cảm nhận tinh tế về chất liệu.</p><p>Sản phẩm lụa Vạn Phúc như khăn, áo dài, trang phục và quà tặng mang vẻ thanh lịch, phù hợp với người yêu giá trị thủ công và văn hóa Việt.</p>', imageUrl: 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&w=1200&q=80', status: 'published', order: 9 },
  { title: 'Phú Vinh – Sợi mây kể chuyện đôi tay', village: 'Phú Vinh', province: 'Hà Nội', craft: 'Mây tre đan', excerpt: 'Từng đường đan mây tre tạo nên sản phẩm bền đẹp, mang hơi thở thủ công Việt.', content: '<p>Phú Vinh (Chương Mỹ, Hà Nội) giữ nghề mây tre đan với kỹ thuật tỉ mỉ: chọn nguyên liệu, vót nan, phơi phóng và đan lát thành sản phẩm.</p><p>Giỏ, khay, hộp quà mây tre không chỉ hữu dụng mà còn thể hiện sự chăm chút — một lựa chọn quà tặng xanh, thân thiện và giàu bản sắc.</p>', imageUrl: 'https://images.unsplash.com/photo-1595408076683-5d0c228d8a3a?auto=format&fit=crop&w=1200&q=80', status: 'published', order: 8 },
  { title: 'Đông Hồ – Tranh dân gian từ sắc gỗ', village: 'Đông Hồ', province: 'Bắc Ninh', craft: 'Tranh dân gian', excerpt: 'Màu điệp, giấy dó và ván khắc gỗ tạo nên những bức tranh gần gũi với đời sống Việt.', content: '<p>Tranh Đông Hồ (Thuận Thành, Bắc Ninh) là dòng tranh dân gian nổi tiếng với kỹ thuật in khắc gỗ và màu tự nhiên. Chủ đề tranh gắn với phong tục, ước vọng và sinh hoạt đời thường.</p><p>Mỗi bức tranh là một lát cắt văn hóa, phù hợp làm quà lưu niệm hoặc trang trí mang tinh thần Việt.</p>', imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=1200&q=80', status: 'published', order: 7 },
  { title: 'Chuông – Nón lá lưu giữ dáng quê', village: 'Chuông', province: 'Hà Nội', craft: 'Làm nón', excerpt: 'Nón lá Chuông mỏng, nhẹ, thanh thoát — biểu tượng của vẻ đẹp mộc mạc.', content: '<p>Làng Chuông (Thanh Oai, Hà Nội) nổi tiếng với nghề làm nón lá. Lá được chọn kỹ, phơi vừa độ, khâu từng vòng đều tay để tạo nên chiếc nón nhẹ và bền.</p><p>Nón lá không chỉ che nắng mưa mà còn là món quà mang hình ảnh làng quê Việt Nam.</p>', imageUrl: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80', status: 'published', order: 6 },
  { title: 'Hạ Thái – Sơn mài nhiều lớp thời gian', village: 'Hạ Thái', province: 'Hà Nội', craft: 'Sơn mài', excerpt: 'Những lớp sơn, mài và đánh bóng tạo nên bề mặt sâu, bóng và bền theo năm tháng.', content: '<p>Làng sơn mài Hạ Thái (Thường Tín, Hà Nội) nổi bật với kỹ thuật sơn nhiều lớp, mài đi mài lại để lộ chiều sâu vật liệu. Mỗi sản phẩm là sự kiên nhẫn của người thợ.</p><p>Hộp, khay, tranh sơn mài mang vẻ sang trọng, thích hợp làm quà tặng cao cấp.</p>', imageUrl: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1200&q=80', status: 'published', order: 5 },
  { title: 'Kim Bồng – Mộc mạc từ nghề mộc', village: 'Kim Bồng', province: 'Quảng Nam', craft: 'Mộc', excerpt: 'Từ gỗ đến chi tiết chạm khắc, nghề mộc Kim Bồng giữ tinh thần thủ công và bền bỉ.', content: '<p>Làng mộc Kim Bồng (Cẩm Kim, Hội An, Quảng Nam) gắn với nghề mộc truyền thống, từng đóng góp vào các công trình kiến trúc cổ. Người thợ chọn gỗ, đo đạc, ghép mộng và chạm khắc tỉ mỉ.</p><p>Sản phẩm mộc từ Kim Bồng mang nét mộc mạc, bền chắc và giàu giá trị thủ công.</p>', imageUrl: 'https://images.unsplash.com/photo-1449247709967-d4461a6a6103?auto=format&fit=crop&w=1200&q=80', status: 'published', order: 4 },
  { title: 'Bau Trúc – Gốm Chăm và hơi thở nắng gió', village: 'Bau Trúc', province: 'Ninh Thuận', craft: 'Gốm', excerpt: 'Gốm Chăm không dùng bàn xoay, tạo hình bằng tay và kỹ thuật truyền thống độc đáo.', content: '<p>Làng gốm Bau Trúc (Ninh Thuận) là một trong những làng gốm cổ của người Chăm. Nghệ nhân tạo hình bằng tay, đi vòng quanh khối đất, kết hợp hoa văn đặc trưng.</p><p>Sản phẩm gốm Bau Trúc mang sắc thái văn hóa Chăm, phù hợp với người tìm quà tặng giàu bản sắc vùng miền.</p>', imageUrl: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=1200&q=80', status: 'published', order: 3 },
  { title: 'Tân Châu – Lụa nhuộm trái mặc nưa', village: 'Tân Châu', province: 'An Giang', craft: 'Dệt lụa', excerpt: 'Sắc đen bóng đặc trưng của lụa Tân Châu đến từ kỹ thuật nhuộm truyền thống.', content: '<p>Lụa Tân Châu (An Giang) nổi tiếng với màu đen óng, mềm và mát. Kỹ thuật nhuộm và xử lý lụa tạo nên độ rũ, độ bóng riêng khó nhầm lẫn.</p><p>Các sản phẩm từ lụa Tân Châu như khăn, trang phục hay quà tặng mang vẻ sang trọng, đậm chất Nam Bộ.</p>', imageUrl: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?auto=format&fit=crop&w=1200&q=80', status: 'published', order: 2 },
  { title: 'Phước Tích – Gốm xưa bên dòng Ô Lâu', village: 'Phước Tích', province: 'Thừa Thiên Huế', craft: 'Gốm', excerpt: 'Di sản gốm Phước Tích gắn với kiến trúc và đời sống xứ Huế, mang vẻ trầm lắng.', content: '<p>Làng cổ Phước Tích (Thừa Thiên Huế) từng nổi tiếng với nghề gốm, sản phẩm gắn với nhà vườn và kiến trúc Huế. Nghề gốm nơi đây mang dấu ấn thời gian và sự mộc mạc.</p><p>Những sản phẩm gốm lấy cảm hứng từ Phước Tích gợi nhớ vẻ đẹp trầm, thích hợp làm quà tặng mang tinh thần xứ Huế.</p>', imageUrl: 'https://images.unsplash.com/photo-1493106641515-6b5631de4bb9?auto=format&fit=crop&w=1200&q=80', status: 'published', order: 1 },
];

await RegionStory.deleteMany({});
await RegionStory.insertMany(regionStories);
console.log(`Đã nạp ${regionStories.length} câu chuyện vùng miền`);

await VillageStory.deleteMany({});
await VillageStory.insertMany(villageStories);
console.log(`Đã nạp ${villageStories.length} câu chuyện làng nghề`);

await mongoose.disconnect();

console.log('Seed hoàn tất');