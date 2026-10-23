import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    phone: {
      type: String,
      trim: true,
      default: ''
    },

    passwordHash: {
      type: String,
      required: true,
      select: false
    },

    role: {
      type: String,
      enum: ['admin', 'staff', 'customer'],
      default: 'customer'
    }
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);