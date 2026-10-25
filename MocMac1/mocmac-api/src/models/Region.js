import mongoose from 'mongoose';

const regionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    image: { type: String, default: '' },
    description: { type: String, default: '' },
    productCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Region = mongoose.model('Region', regionSchema);
