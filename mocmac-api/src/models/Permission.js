import mongoose from 'mongoose';

const permissionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['users', 'products', 'orders', 'contacts', 'reviews', 'coupons', 'role-requests', 'audit', 'notifications', 'system', 'auth'],
    required: true
  },
  action: {
    type: String,
    enum: ['view', 'create', 'update', 'delete', 'manage', 'approve', 'reject', 'send', 'read', 'write', 'execute'],
    required: true
  },
  isSystem: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

export const Permission = mongoose.model('Permission', permissionSchema);