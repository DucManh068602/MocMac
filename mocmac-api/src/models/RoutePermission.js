import mongoose from 'mongoose';

const routePermissionSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['admin', 'staff', 'collaborator', 'cooperative', 'customer'],
      required: true,
    },
    path: {
      type: String,
      required: true,
      trim: true,
    },
    method: {
      type: String,
      enum: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', '*'],
      default: '*',
    },
    allowed: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

routePermissionSchema.index({ role: 1, path: 1, method: 1 }, { unique: true });

export const RoutePermission = mongoose.model('RoutePermission', routePermissionSchema);
