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
      enum: ['new', 'processing', 'quoted', 'done'],
      default: 'new',
    },
  },
  { timestamps: true },
);

export const QuotationRequest = mongoose.model('QuotationRequest', quotationRequestSchema);
