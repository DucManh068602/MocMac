import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { logAction, getRequestInfo } from '../utils/auditLog.js';

const signToken = (user) =>
  jwt.sign({ sub: String(user._id), role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  });

const toPublicUser = (user) => ({
  id: String(user._id),
  name: user.name,
  email: user.email,
  role: user.role,
});

export const login = async (req, res) => {
  const { identifier, password } = req.body ?? {};
  const { ip } = getRequestInfo(req);

  if (!identifier || !password) {
    return res.status(400).json({ message: 'Thiếu thông tin đăng nhập' });
  }

  const key = String(identifier).trim();
  const user = await User.findOne({
    $or: [{ email: key.toLowerCase() }, { phone: key }],
  }).select('+passwordHash');

  if (!user || !(await bcrypt.compare(String(password), user.passwordHash))) {
    await logAction({
      action: 'auth.login_failed',
      resourceType: 'Auth',
      ip,
      details: { identifier: key },
      status: 'failed',
    });
    return res.status(401).json({ message: 'Sai tài khoản hoặc mật khẩu' });
  }

  await logAction({
    action: 'auth.login_success',
    resourceType: 'Auth',
    user,
    ip,
    details: { email: user.email, role: user.role },
  });

  res.json({ token: signToken(user), user: toPublicUser(user) });
};

export const register = async (req, res) => {
  const { name, email, phone, password } = req.body ?? {};
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Thiếu thông tin' });
  }
  if (String(password).length < 8) {
    return res.status(400).json({ message: 'Mật khẩu tối thiểu 8 ký tự' });
  }

  const exists = await User.exists({ email: String(email).toLowerCase() });
  if (exists) {
    return res.status(409).json({ message: 'Email đã được sử dụng' });
  }

  const passwordHash = await bcrypt.hash(String(password), 10);
  const user = await User.create({
    name,
    email,
    phone: phone ?? '',
    passwordHash,
    role: 'customer',
  });

  res.status(201).json({ token: signToken(user), user: toPublicUser(user) });
};
