import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema(
  {
    from: { type: String, required: true, trim: true },
    to: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);
