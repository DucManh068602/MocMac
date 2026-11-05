import mongoose from 'mongoose';

const rolePermissionSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['admin', 'staff', 'collaborator', 'cooperative', 'customer'],
    required: true
  },
  permission: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Permission',
    required: true
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  assignedAt: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    trim: true
  }
}, { timestamps: true, unique: { role: 1, permission: 1 } });

export const RolePermission = mongoose.model('RolePermission', rolePermissionSchema);