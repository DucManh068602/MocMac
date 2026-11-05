import 'dotenv/config';
import mongoose from 'mongoose';
import { Product } from './src/models/Product.js';
import { Review } from './src/models/Review.js';

await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mocmac');

console.log('Converting image URLs to relative paths...');

let totalUpdated = 0;

// Process all products
const products = await Product.find({ images: { $exists: true, $ne: [] } }).lean();
for (const product of products) {
  const updatedImages = product.images.map(img => {
    if (typeof img !== 'string') return img;
    const urlMatch = img.match(/^https?:\/\/[^/]+\/(uploads\/.+)$/);
    if (urlMatch) return '/' + urlMatch[1];  // /uploads/filename.ext
    if (img.startsWith('http')) return img;  // Leave other external URLs as-is
    if (img.startsWith('/uploads')) return img;  // Already relative with slash
    if (img.startsWith('uploads')) return '/' + img;  // Add leading slash
    return '/' + img;  // Assume it's a filename, prepend /uploads
  });

  // Only update if URLs changed
  const changed = product.images.some((img, i) => img !== updatedImages[i]);
  if (changed) {
    await Product.updateOne({ _id: product._id }, { $set: { images: updatedImages } });
    totalUpdated++;
    console.log(`  Updated ${product.slug || product._id}: ${updatedImages.length} images`);
  }
}

console.log(`Total products updated: ${totalUpdated}`);

// Verify
const sample = await Product.findOne({ images: { $exists: true, $ne: [] } }).lean();
console.log('Sample product images:', sample.images);

await mongoose.disconnect();
