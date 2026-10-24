import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

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
  req.user = { id: String(user._id), role: user.role, isActive };
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
    next();
  };
}
