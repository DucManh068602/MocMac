import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

import { Product } from './models/Product.js';
import { User } from './models/User.js';
import { Region } from './models/Region.js';
import { Province } from './models/Province.js';
import { RegionStory } from './models/RegionStory.js';
import { VillageStory } from './models/VillageStory.js';
import { Coupon } from './models/Coupon.js';
import { Deal } from './models/Deal.js';
import { FlashSale } from './models/FlashSale.js';
import { SiteContent } from './models/SiteContent.js';
import { Permission } from './models/Permission.js';
import { RolePermission } from './models/RolePermission.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, 'seed-data');

function readJson(name, fallback = []) {
  const file = path.join(dataDir, `${name}.json`);
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function asDate(value) {
  return value ? new Date(value) : value;
}

async function replaceCollection(Model, docs, label) {
  await Model.deleteMany({});
  if (!docs.length) {
    console.log(`- ${label}: 0 bản ghi (bỏ qua)`);
    return 0;
  }
  await Model.insertMany(docs, { ordered: false });
  console.log(`- ${label}: ${docs.length} bản ghi`);
  return docs.length;
}

async function upsertBootstrapAccount(Model, filter, data, label) {
  const exists = await Model.exists(filter);
  if (exists) {
    console.log(`- ${label}: đã tồn tại ${filter.email} (giữ nguyên)`);
    return false;
  }
  const passwordHash = await bcrypt.hash(data.password, 10);
  await Model.create({ ...data, passwordHash });
  console.log(`- ${label}: đã tạo ${filter.email} (mật khẩu từ env hoặc mặc định)`);
  return true;
}

async function seed() {
  if (!process.env.MONGODB_URI) {
    throw new Error('Thiếu MONGODB_URI trong mocmac-api/.env');
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Đã kết nối MongoDB');
  console.log(`Đọc dữ liệu seed từ: ${dataDir}`);

  const regions = readJson('regions');
  const provinces = readJson('provinces');
  const products = readJson('products');
  const regionStories = readJson('regionStories');
  const villageStories = readJson('villageStories');
  const coupons = readJson('coupons').map((c) => ({
    ...c,
    startsAt: asDate(c.startsAt),
    validFrom: asDate(c.validFrom),
    validTo: asDate(c.validTo),
    shippingDiscount: Number(c.shippingDiscount || 0),
  }));
  const deals = readJson('deals').map((d) => ({
    ...d,
    startsAt: asDate(d.startsAt),
    endsAt: asDate(d.endsAt),
  }));
  const flashSales = readJson('flashSales').map((f) => ({
    ...f,
    startsAt: asDate(f.startsAt),
    endsAt: asDate(f.endsAt),
  }));
  const siteContents = readJson('siteContents');
  const permissions = readJson('permissions');
  const rolePermissionsRaw = readJson('rolePermissions');

  await replaceCollection(Region, regions, 'regions');
  await replaceCollection(Province, provinces, 'provinces');
  await replaceCollection(Product, products, 'products');
  await replaceCollection(RegionStory, regionStories, 'regionStories');
  await replaceCollection(VillageStory, villageStories, 'villageStories');
  await replaceCollection(Coupon, coupons, 'coupons');
  await replaceCollection(Deal, deals, 'deals');
  await replaceCollection(FlashSale, flashSales, 'flashSales');
  await replaceCollection(SiteContent, siteContents, 'siteContents');

  await Permission.deleteMany({});
  const permissionDocs = permissions.length ? await Permission.insertMany(permissions, { ordered: false }) : [];
  const permByName = new Map(permissionDocs.map((p) => [p.name, p._id]));

  await RolePermission.deleteMany({});
  const rolePermissionDocs = rolePermissionsRaw
    .map((rp) => ({ role: rp.role, permission: permByName.get(rp.permissionName) }))
    .filter((rp) => rp.role && rp.permission);
  if (rolePermissionDocs.length) await RolePermission.insertMany(rolePermissionDocs, { ordered: false });
  console.log(`- permissions: ${permissionDocs.length} bản ghi`);
  console.log(`- rolePermissions: ${rolePermissionDocs.length} bản ghi`);

  await upsertBootstrapAccount(
    User,
    { email: String(process.env.ADMIN_EMAIL || 'admin@admin.mocmac.vn').toLowerCase() },
    {
      name: 'Quản trị viên',
      email: String(process.env.ADMIN_EMAIL || 'admin@admin.mocmac.vn').toLowerCase(),
      phone: '0123456789',
      password: process.env.ADMIN_PASSWORD || 'Admin@12345',
      role: 'admin',
      isActive: true,
    },
    'admin'
  );

  await upsertBootstrapAccount(
    User,
    { email: String(process.env.STAFF_EMAIL || 'staff@staff.mocmac.vn').toLowerCase() },
    {
      name: 'Nhân viên Mộc Mạc',
      email: String(process.env.STAFF_EMAIL || 'staff@staff.mocmac.vn').toLowerCase(),
      phone: '0123456790',
      password: process.env.STAFF_PASSWORD || 'Staff@12345',
      role: 'staff',
      isActive: true,
    },
    'staff'
  );

  console.log('\n========================================');
  console.log('Seed hoàn tất.');
  console.log('----------------------------------------');
  console.log('Tài khoản bootstrap:');
  console.log(`- Admin: ${process.env.ADMIN_EMAIL || 'admin@admin.mocmac.vn'} / ${process.env.ADMIN_PASSWORD || 'Admin@12345'}`);
  console.log(`- Staff: ${process.env.STAFF_EMAIL || 'staff@staff.mocmac.vn'} / ${process.env.STAFF_PASSWORD || 'Staff@12345'}`);
  console.log('----------------------------------------');
  console.log('Chạy API: npm run dev (mocmac-api)');
  console.log('Chạy web: npm start (my-app)');
  console.log('========================================\n');
}

seed()
  .catch((err) => {
    console.error('Seed thất bại:', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {});
  });
