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
      required: function () { return !this.googleId; },
      select: false
    },

    googleId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },

    refreshTokenHash: { type: String, select: false, default: null },

    role: {
      type: String,
      enum: ['admin', 'staff', 'collaborator', 'cooperative', 'customer'],
      default: 'customer'
    },

    isActive: {
      type: Boolean,
      default: true
    },

    isVerified: {
      type: Boolean,
      default: false
    },

    verifyOTP: {
      type: String,
      default: null,
    },

    verifyOTPExpires: {
      type: Date,
      default: null,
    },

    originalEmail: {
      type: String,
      trim: true
    },

    resetOTP: {
      type: String,
      default: null,
    },

    resetOTPExpires: {
      type: Date,
      default: null,
    },

    addresses: [
      {
        fullName: { type: String, required: true },
        phone: { type: String, required: true },
        provinceCode: { type: Number },
        provinceName: { type: String },
        districtCode: { type: Number },
        districtName: { type: String },
        wardCode: { type: Number },
        wardName: { type: String },
        streetAddress: { type: String, required: true },
        isDefault: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);
