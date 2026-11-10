import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, default: '' },
    discountType: { type: String, enum: ['percent', 'fixed'], default: 'percent' },
    discountValue: { type: Number, required: true },
    minOrderValue: { type: Number, default: 0 },
    maxDiscount: { type: Number, default: 0 },
    usageLimit: { type: Number, default: 0 },
    usedCount: { type: Number, default: 0 },
    startsAt: { type: Date },
    expiryDate: { type: Date, required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

couponSchema.methods.getStatus = function () {
  if (!this.active) return 'vô hiệu';
  if (new Date(this.expiryDate) < new Date()) return 'hết hạn';
  if (this.usageLimit > 0 && this.usedCount >= this.usageLimit) return 'hết lượt sử dụng';
  return 'hoạt động';
};

export const Coupon = mongoose.model('Coupon', couponSchema);
