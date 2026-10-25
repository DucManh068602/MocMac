import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    phone: {
      type: String,
      trim: true,
      default: ''
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },

    subject: {
      type: String,
      trim: true,
      default: ''
    },

    message: {
      type: String,
      required: true,
      trim: true
    },

    status: {
      type: String,
      enum: ['new', 'processing', 'done'],
      default: 'new'
    }
  },
  {
    timestamps: true
  }
);

export const Contact = mongoose.model('Contact', contactSchema);