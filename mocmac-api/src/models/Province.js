import mongoose from 'mongoose';

const provinceSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    region: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Province = mongoose.model('Province', provinceSchema);
