import mongoose from 'mongoose';

const roleRequestSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    requestedRole: {
      type: String,
      enum: ['collaborator', 'cooperative', 'staff', 'admin'],
      required: true,
    },
    reason: { type: String, default: '', trim: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true },
);

export const RoleRequest = mongoose.model('RoleRequest', roleRequestSchema);
