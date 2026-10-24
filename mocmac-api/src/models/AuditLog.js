import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true, trim: true },
    resourceType: { type: String, required: true, trim: true },
    resourceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userEmail: { type: String, default: '' },
    userRole: { type: String, default: '' },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: { type: String, enum: ['success', 'failed'], default: 'success' },
    ip: { type: String, default: '' },
  },
  { timestamps: true }
);

auditLogSchema.index({ resourceType: 1, createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
