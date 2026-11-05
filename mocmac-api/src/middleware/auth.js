import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { RolePermission } from '../models/RolePermission.js';

const ADMIN_DOMAIN = '.mocmac.vn';

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization ?? '';
  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Chưa đăng nhập' });
  }

  let payload;
  try {
    payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
  }

  const user = await User.findById(payload.sub).lean();
  if (!user) {
    return res.status(401).json({ message: 'Tài khoản không còn tồn tại' });
  }

  const isActive = user.isActive !== false;
  req.user = { id: String(user._id), role: user.role, isActive, createdAt: user.createdAt, email: user.email };
  if (!isActive) {
    return res.status(403).json({ message: 'Tài khoản đã bị khóa' });
  }
  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Không đủ quyền' });
    }
    const email = String(req.user?.email || '').toLowerCase();
    if (!email.endsWith(ADMIN_DOMAIN)) {
      return res.status(403).json({ message: 'Tài khoản khách hàng không được phép truy cập' });
    }
    next();
  };
}

export function requireAdminDomain() {
  return (req, res, next) => {
    const email = String(req.user?.email || '').toLowerCase();
    if (!email.endsWith(ADMIN_DOMAIN)) {
      return res.status(403).json({ message: 'Tài khoản khách hàng không được phép truy cập' });
    }
    next();
  };
}

/**
 * Middleware kiểm tra permission theo role.
 * Nếu người dùng là admin và email thuộc .mocmac.vn -> luôn cho phép (admin siêu admin).
 * Nếu không phải admin -> kiểm tra trong bảng RolePermission.
 */
export function requirePermission(permissionName) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Chưa đăng nhập' });
    }

    // Admin (trên .mocmac.vn) luôn được phép mọi hành động hệ thống
    const email = String(req.user.email || '').toLowerCase();
    if (req.user.role === 'admin' && email.endsWith(ADMIN_DOMAIN)) {
      return next();
    }

    try {
      const rps = await RolePermission.find({ role: req.user.role }).populate('permission');
      const hasPermission = rps.some((rp) => rp.permission?.name === permissionName);
      if (!hasPermission) {
        return res.status(403).json({
          message: `Bạn không có quyền '${permissionName}'.`,
        });
      }
      return next();
    } catch (err) {
      console.error('requirePermission error', err);
      return res.status(500).json({ message: 'Lỗi phân quyền' });
    }
  };
}
