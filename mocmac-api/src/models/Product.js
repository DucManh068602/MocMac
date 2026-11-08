import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true },
    slug: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    cat: { type: String, default: '' },
    type: { type: String, default: '' },
    region: { type: String, default: '' },
    province: { type: String, default: '' },
    village: { type: String, default: '' },
    price: { type: Number, required: true },
    deal: { type: mongoose.Schema.Types.ObjectId, ref: 'Deal', default: null },
    rate: { type: Number, default: 0 },
    reviews: { type: Number, default: 0 },
    avgRating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    ocop: { type: Number, default: 0 },
    heritage: { type: String, default: null },
    seasons: { type: [Number], default: [] },
    occasion: { type: [String], default: [] },
    inStock: { type: Boolean, default: true },
    stock: { type: Number, default: 0 },
    totalStock: { type: Number, default: 0 },
    sold: { type: Number, default: 0 },
    preorder: { type: Boolean, default: false },
    icon: { type: String, default: '' },
    badges: { type: [String], default: [] },
    images: { type: [String], default: [] },
    qrCode: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Product = mongoose.model('Product', productSchema);
