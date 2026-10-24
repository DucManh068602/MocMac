import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
    type: { type: String, enum: ['order', 'contact', 'system', 'promo'], default: 'system' },
     isRead: { type: Boolean, default: false },
     recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
     orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
     link: { type: String, default: '' },
     sent: { type: Boolean, default: false },
     sentAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Notification = mongoose.model('Notification', notificationSchema);
