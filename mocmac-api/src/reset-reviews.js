import 'dotenv/config';
import mongoose from 'mongoose';
import { Product } from './models/Product.js';
import { Review } from './models/Review.js';

await mongoose.connect(process.env.MONGODB_URI);

// Reset toàn bộ chỉ số đánh giá trên sản phẩm về 0
await Product.updateMany({}, { $set: { avgRating: 0, numReviews: 0, rate: 0, reviews: 0 } });
console.log('Đã reset đánh giá toàn bộ sản phẩm về 0');

// Tính lại từ collection Review (chỉ lấy status visible)
const products = await Product.find({}).lean();
let updated = 0;

for (const p of products) {
  const stats = await Review.aggregate([
    { $match: { product: p._id, status: 'visible' } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  const avgRating = stats[0]?.avg ? Number(stats[0].avg.toFixed(1)) : 0;
  const numReviews = stats[0]?.count || 0;

  await Product.findByIdAndUpdate(p._id, {
    avgRating,
    numReviews,
    rate: avgRating,
    reviews: numReviews,
  });
  updated++;
}

console.log(`Đã tính lại đánh giá cho ${updated} sản phẩm.`);
await mongoose.disconnect();
