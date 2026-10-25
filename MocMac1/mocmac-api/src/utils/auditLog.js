import { AuditLog } from '../models/AuditLog.js';

export async function logAction({
  action,
  resourceType,
  resourceId = null,
  user = null,
  details = {},
  status = 'success',
  ip = '',
}) {
  try {
    const entry = {
      action,
      resourceType,
      resourceId,
      status,
      details,
    };

    if (user) {
      entry.userId = user._id || user.id;
      entry.userEmail = user.email || '';
      entry.userRole = user.role || '';
    }

    if (ip) {
      entry.ip = ip;
    }

    await AuditLog.create(entry);
  } catch (err) {
    console.error('❌ Audit log write failed:', err?.message || err);
  }
}

export function getRequestInfo(req) {
  return {
    user: req.user || null,
    ip: req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '',
  };
}
