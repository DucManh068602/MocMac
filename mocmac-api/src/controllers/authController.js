import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { logAction, getRequestInfo } from '../utils/auditLog.js';
import { sendMail } from '../utils/mailer.js';

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

export const forgotPassword = async (req, res) => {
  const { ip } = getRequestInfo(req);
  const { email } = req.body ?? {};
  if (!email) {
    return res.status(400).json({ message: 'Vui lòng nhập email.' });
  }

  const key = String(email).toLowerCase().trim();
  const user = await User.findOne({ email: key });
  if (!user) {
    return res.status(404).json({ message: 'Không tìm thấy tài khoản.' });
  }
  if (user.role === 'admin' || user.role === 'staff') {
    return res
      .status(400)
      .json({ message: 'Tài khoản quản trị dùng cổng admin để đặt lại mật khẩu.' });
  }

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  user.resetOTP = otp;
  user.resetOTPExpires = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();

  await sendMail({
    to: user.email,
    subject: 'Mã OTP đặt lại mật khẩu Mộc Mạc',
    text: `Mã OTP của bạn là: ${otp}. Mã có hiệu lực trong 10 phút.`,
    html: `<p>Mã OTP của bạn là: <strong>${otp}</strong></p><p>Mã có hiệu lực trong 10 phút.</p>`,
  });

  await logAction({
    action: 'auth.otp_sent',
    resourceType: 'Auth',
    ip,
    details: { email: user.email },
    user,
  });

  return res.json({ success: true, message: 'Mã OTP đã được gửi đến email.' });
};

export const resetPassword = async (req, res) => {
  const { ip } = getRequestInfo(req);
  const { email, otp, password } = req.body ?? {};
  if (!email || !otp || !password) {
    return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin.' });
  }
  if (String(password).length < 8) {
    return res.status(400).json({ message: 'Mật khẩu tối thiểu 8 ký tự.' });
  }

  const key = String(email).toLowerCase().trim();
  const user = await User.findOne({ email: key }).select('+passwordHash');
  if (!user) {
    return res.status(404).json({ message: 'Không tìm thấy tài khoản.' });
  }
  if (
    user.resetOTP !== String(otp) ||
    !user.resetOTPExpires ||
    new Date() > new Date(user.resetOTPExpires)
  ) {
    return res.status(401).json({ message: 'Mã OTP không đúng hoặc đã hết hạn.' });
  }

  user.passwordHash = await bcrypt.hash(String(password), 10);
  user.resetOTP = null;
  user.resetOTPExpires = null;
  await user.save();

  await logAction({
    action: 'auth.password_reset',
    resourceType: 'Auth',
    ip,
    details: { email: user.email },
    user,
  });

  return res.json({
    success: true,
    message: 'Đặt lại mật khẩu thành công.',
    token: signToken(user),
    user: toPublicUser(user),
  });
};

export const adminResetPassword = async (req, res) => {
  const { ip } = getRequestInfo(req);
  const { email, resetSecret, password } = req.body ?? {};
  if (!email || !resetSecret || !password) {
    return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin.' });
  }
  if (String(password).length < 8) {
    return res.status(400).json({ message: 'Mật khẩu tối thiểu 8 ký tự.' });
  }
  if (!process.env.RESET_SECRET || resetSecret !== process.env.RESET_SECRET) {
    return res.status(403).json({ message: 'Mã bí mật không hợp lệ.' });
  }

  const key = String(email).toLowerCase().trim();
  const adminUser = await User.findOne({ email: key }).select('+passwordHash');
  if (!adminUser) {
    return res.status(404).json({ message: 'Không tìm thấy tài khoản quản trị.' });
  }
  if (adminUser.role !== 'admin') {
    return res.status(403).json({ message: 'Tài khoản này không có quyền quản trị.' });
  }

  adminUser.passwordHash = await bcrypt.hash(String(password), 10);
  adminUser.isActive = true;
  await adminUser.save();

  await logAction({
    action: 'auth.admin_password_reset',
    resourceType: 'Auth',
    ip,
    details: { email: adminUser.email },
    user: adminUser,
  });

  return res.json({ success: true, message: 'Đặt lại mật khẩu quản trị thành công.' });
};
