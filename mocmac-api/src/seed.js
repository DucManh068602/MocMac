import 'dotenv/config';
import fs from 'node:fs';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

import { Product } from './models/Product.js';
import { User } from './models/User.js';
import { Region } from './models/Region.js';
import { slugify } from './utils/slugify.js';

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
  process.env.ADMIN_EMAIL ?? 'admin@mocmac.admin.vn'
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

await mongoose.disconnect();

console.log('Seed hoàn tất');