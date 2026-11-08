import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    provinceCode: { type: String, required: true },
    provinceName: { type: String, default: '' },
    districtCode: { type: String, default: '' },
    districtName: { type: String, default: '' },
    wardCode: { type: String, required: true },
    wardName: { type: String, default: '' },
    streetAddress: { type: String, required: true, trim: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true },
);

addressSchema.index({ user: 1 });
addressSchema.index({ user: 1, isDefault: 1 }, { partialFilterExpression: { isDefault: true } });

export const Address = mongoose.model('Address', addressSchema);
