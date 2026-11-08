import mongoose from 'mongoose';

const flashSaleSchema = new mongoose.Schema({
  key: { type: String, unique: true, default: 'storewide' },
  active: { type: Boolean, default: false },
  discountPercent: { type: Number, default: 0, min: 1, max: 90 },
  startsAt: { type: Date, default: null },
  endsAt: { type: Date, default: null },
}, { timestamps: true });

export const FlashSale = mongoose.model('FlashSale', flashSaleSchema);
