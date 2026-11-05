import 'dotenv/config';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Product } from './models/Product.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadServerUrl = process.env.UPLOAD_SERVER_URL || 'http://localhost:5001';
const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
const tempDir = path.join(__dirname, '..', 'tmp_migrate');

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

async function downloadImage(url) {
  const response = await fetch(url, {
    timeout: 30000,
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  const buffer = await response.arrayBuffer();
  const rawContentType = response.headers.get('content-type') || 'image/jpeg';
  const contentType = rawContentType.split(';')[0].trim() || 'image/jpeg';
  return { buffer: Buffer.from(buffer), contentType };
}

async function uploadToNewServer(buffer, contentType, filename) {
  const form = new FormData();
  form.append('images', new Blob([buffer], { type: contentType }), filename);

  const res = await fetch(uploadServerUrl + '/upload', {
    method: 'POST',
    body: form,
  });

  const data = await res.json();
  if (data.success && data.urls) {
    return data.urls;
  }
  throw new Error('Upload failed: ' + JSON.stringify(data));
}

async function migrateImage(url) {
  try {
    const urlObj = new URL(url);
    const ext = path.extname(urlObj.pathname) || '.jpg';
    const { buffer, contentType } = await downloadImage(url);
    const newFilename = 'migrated-' + Date.now() + '-' + Math.round(Math.random() * 1e9) + ext;
    const newUrls = await uploadToNewServer(buffer, contentType, newFilename);
    return newUrls[0];
  } catch (error) {
    console.error(`  ❌ Failed to migrate: ${url} - ${error.message}`);
    return null;
  }
}

function cleanupTemp() {
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

async function runMigration() {
  console.log('====================================');
  console.log('🚀 Bắt đầu migrate hình ảnh sản phẩm');
  console.log('====================================');

  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mocmac';
  await mongoose.connect(mongoUri);
  console.log('✅ Đã kết nối MongoDB:', mongoUri);

  try {
    const products = await Product.find({ images: { $exists: true, $ne: [] } }).lean();
    console.log(`📦 Tìm thấy ${products.length} sản phẩm có hình ảnh`);

    let migratedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    for (const product of products) {
      const oldImages = product.images || [];
      const newImages = [];

      for (const imgUrl of oldImages) {
        if (imgUrl.startsWith(backendUrl)) {
          newImages.push(imgUrl);
          skippedCount++;
          continue;
        }

        if (imgUrl.startsWith(uploadServerUrl)) {
          const convertedUrl = backendUrl + imgUrl.slice(uploadServerUrl.length);
          newImages.push(convertedUrl);
          skippedCount++;
          continue;
        }

        console.log(`  Đang migrate [${product.name}]: ${imgUrl.slice(0, 60)}...`);
        const newUrl = await migrateImage(imgUrl);
        if (newUrl) {
          newImages.push(newUrl);
          migratedCount++;
        } else {
          newImages.push(imgUrl);
          failedCount++;
        }
      }

      await Product.updateOne({ _id: product._id }, { $set: { images: newImages } });
      console.log(`  ✅ Đã cập nhật: ${product.name} (${oldImages.length} ảnh)`);
    }

    console.log('\n====================================');
    console.log('📊 Kết quả migrate:');
    console.log(`   ✅ Migrated: ${migratedCount}`);
    console.log(`   ⏭️  Skipped (already on port 5001): ${skippedCount}`);
    console.log(`   ❌ Failed: ${failedCount}`);
    console.log('====================================');
  } catch (error) {
    console.error('❌ Lỗi migrate:', error);
  } finally {
    cleanupTemp();
    await mongoose.disconnect();
    console.log('🔌 Đã ngắt kết nối MongoDB');
  }
}

runMigration();
