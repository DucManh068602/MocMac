import mongoose from 'mongoose';

const quotationRequestSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true, default: '' },
    company: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },
    occasion: { type: String, trim: true, default: '' },
    items: [
      {
        productId: { type: mongoose.Schema.Types.Number },
        name: { type: String, required: true, trim: true },
        quantity: { type: Number, required: true, min: 1, default: 1 },
        price: { type: Number, default: 0 },
      },
    ],
    totalEstimate: { type: Number, default: 0 },
    preferredSlot: { type: String, trim: true, default: '' },
    message: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['new', 'processing', 'quoted', 'accepted', 'done'],
      default: 'new',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['', 'cod', 'bank_transfer'],
      default: '',
    },
    paidAt: { type: Date, default: null },
    paymentNote: { type: String, trim: true, default: '' },
    appliedCoupon: {
      code: { type: String, default: '' },
      description: { type: String, default: '' },
      discountType: { type: String, enum: ['percent', 'fixed', ''], default: '' },
      discountValue: { type: Number, default: 0 },
      maxDiscount: { type: Number, default: 0 },
    },
    discountAmount: { type: Number, default: 0 },
    quotedTotal: { type: Number, default: 0 },
    quotedAt: { type: Date, default: null },
    acceptToken: { type: String, default: '' },
    acceptedAt: { type: Date, default: null },
    couponUsageCounted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const QuotationRequest = mongoose.model('QuotationRequest', quotationRequestSchema);