import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';
import { logAction, getRequestInfo } from '../utils/auditLog.js';
import { sendMail, otpEmailTemplate } from '../utils/mailer.js';

const signToken = (user) =>
  jwt.sign({ sub: String(user._id), role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  });

const signRefreshToken = (user) => jwt.sign({ sub: String(user._id), type: 'refresh' }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '14d' });
const authResponse = async (user) => {
  const response = { token: signToken(user), user: toPublicUser(user) };
  if (user.role === 'admin' || user.role === 'staff') {
    const refreshToken = signRefreshToken(user);
    user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await user.save();
    response.refreshToken = refreshToken;
  }
  return response;
};

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

  if (!user.isActive) {
    await logAction({
      action: 'auth.login_blocked',
      resourceType: 'Auth',
      user,
      ip,
      details: { email: user.email, reason: 'not_verified' },
      status: 'blocked',
    });
    return res.status(403).json({ message: 'Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email và nhập mã OTP để kích hoạt.' });
  }

  await logAction({
    action: 'auth.login_success',
    resourceType: 'Auth',
    user,
    ip,
    details: { email: user.email, role: user.role },
  });

  res.json(await authResponse(user));
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
    isActive: false,
    isVerified: false,
  });

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  user.verifyOTP = otp;
  user.verifyOTPExpires = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();

  await sendMail({
    to: user.email,
    subject: 'Mã OTP kích hoạt tài khoản Mộc Mạc',
    html: otpEmailTemplate({
      title: 'Kích hoạt tài khoản Mộc Mạc',
      subtitle: 'Chào mừng bạn đến với cộng đồng người yêu thích đặc sản & làng nghề Việt. Mã OTP kích hoạt tài khoản của bạn là:',
      otp,
    }),
  });

  await logAction({
    action: 'auth.register_otp_sent',
    resourceType: 'Auth',
    user,
    details: { email: user.email },
  });

  return res.status(201).json({
    success: true,
    message: 'Tài khoản đã được tạo. Vui lòng kiểm tra email để nhập mã OTP kích hoạt.',
    requiresVerification: true,
    email: user.email,
  });
};

export const verifyRegisterOtp = async (req, res) => {
  const { email, otp } = req.body ?? {};
  if (!email || !otp) {
    return res.status(400).json({ message: 'Vui lòng nhập email và mã OTP.' });
  }

  const key = String(email).toLowerCase().trim();
  const user = await User.findOne({ email: key }).select('+passwordHash');
  if (!user) {
    return res.status(404).json({ message: 'Không tìm thấy tài khoản.' });
  }
  if (user.isVerified) {
    return res.status(400).json({ message: 'Tài khoản đã được kích hoạt. Vui lòng đăng nhập.' });
  }
  if (
    user.verifyOTP !== String(otp) ||
    !user.verifyOTPExpires ||
    new Date() > new Date(user.verifyOTPExpires)
  ) {
    return res.status(401).json({ message: 'Mã OTP không đúng hoặc đã hết hạn.' });
  }

  user.isVerified = true;
  user.isActive = true;
  user.verifyOTP = null;
  user.verifyOTPExpires = null;
  await user.save();

  try {
    await Notification.create({
      title: 'Chào mừng bạn đến với Mộc Mạc',
      content: 'Tài khoản của bạn đã được kích hoạt. Hãy khám phá đặc sản, làng nghề và tạo yêu cầu báo giá quà tặng đầu tiên ngay hôm nay.',
      type: 'system',
      recipient: user._id,
      link: '/san-pham',
      sent: true,
      sentAt: new Date(),
    });
  } catch (e) {
    console.error('Welcome notification error:', e.message || e);
  }

  await logAction({
    action: 'auth.register_otp_verified',
    resourceType: 'Auth',
    user,
    details: { email: user.email },
  });

  return res.json({ success: true, message: 'Kích hoạt tài khoản thành công.', ...(await authResponse(user)) });
};

export const resendRegisterOtp = async (req, res) => {
  const { email } = req.body ?? {};
  if (!email) {
    return res.status(400).json({ message: 'Vui lòng nhập email.' });
  }

  const key = String(email).toLowerCase().trim();
  const user = await User.findOne({ email: key });
  if (!user) {
    return res.status(404).json({ message: 'Không tìm thấy tài khoản.' });
  }
  if (user.isVerified) {
    return res.status(400).json({ message: 'Tài khoản đã được kích hoạt. Vui lòng đăng nhập.' });
  }

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  user.verifyOTP = otp;
  user.verifyOTPExpires = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();

  await sendMail({
    to: user.email,
    subject: 'Mã OTP kích hoạt tài khoản Mộc Mạc (mã mới)',
    html: otpEmailTemplate({
      title: 'Mã OTP kích hoạt mới',
      subtitle: 'Bạn đã yêu cầu gửi lại mã OTP kích hoạt tài khoản Mộc Mạc. Mã mới của bạn là:',
      otp,
    }),
  });

  await logAction({
    action: 'auth.register_otp_resent',
    resourceType: 'Auth',
    user,
    details: { email: user.email },
  });

  return res.json({ success: true, message: 'Mã OTP mới đã được gửi đến email.' });
};

export const refreshSession = async (req, res) => {
  const refreshToken = String(req.body?.refreshToken || '');
  if (!refreshToken) return res.status(401).json({ message: 'Phiên đăng nhập đã hết hạn.' });
  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_SECRET);
    if (payload.type !== 'refresh') throw new Error('Invalid refresh token');
    const user = await User.findById(payload.sub).select('+refreshTokenHash');
    if (!user || user.isActive === false || !user.refreshTokenHash || !(await bcrypt.compare(refreshToken, user.refreshTokenHash))) throw new Error('Invalid refresh token');
    return res.json(await authResponse(user));
  } catch { return res.status(401).json({ message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' }); }
};

export const googleConfig = (_req, res) => {
  res.json({ clientId: process.env.GOOGLE_CLIENT_ID || '' });
};

export const googleLogin = async (req, res) => {
  const credential = String(req.body?.credential || '');
  if (!credential || !process.env.GOOGLE_CLIENT_ID) {
    return res.status(400).json({ message: 'Đăng nhập Google chưa được cấu hình.' });
  }
  try {
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
    if (!response.ok) return res.status(401).json({ message: 'Phiên đăng nhập Google không hợp lệ.' });
    const profile = await response.json();
    if (profile.aud !== process.env.GOOGLE_CLIENT_ID || profile.email_verified !== 'true') {
      return res.status(401).json({ message: 'Không thể xác minh tài khoản Google.' });
    }
    const email = String(profile.email || '').toLowerCase().trim();
    if (!email || !profile.sub) return res.status(401).json({ message: 'Tài khoản Google thiếu thông tin cần thiết.' });
    let user = await User.findOne({ $or: [{ googleId: profile.sub }, { email }] });
    if (!user) {
      user = await User.create({
        name: profile.name || email.split('@')[0],
        email,
        googleId: profile.sub,
        role: 'customer',
        isActive: false,
        isVerified: false,
      });
    } else if (!user.googleId) {
      user.googleId = profile.sub;
      await user.save();
    }

    // Nếu chưa xác thực, sinh OTP gửi email và yêu cầu kích hoạt trước khi vào hệ thống.
    if (!user.isVerified || !user.isActive) {
      const otp = String(Math.floor(100000 + Math.random() * 900000));
      user.verifyOTP = otp;
      user.verifyOTPExpires = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      await sendMail({
        to: user.email,
        subject: 'Mã OTP xác thực đăng nhập Google Mộc Mạc',
        html: otpEmailTemplate({
          title: 'Xác thực đăng nhập Google',
          subtitle: 'Bạn đang đăng nhập bằng tài khoản Google. Mã OTP xác thực của bạn là:',
          otp,
          actionText: 'Xác thực ngay',
          actionUrl: `${process.env.FRONTEND_URL || 'http://localhost:4200'}/dang-nhap`,
        }),
      });

      await logAction({
        action: 'auth.google_otp_sent',
        resourceType: 'Auth',
        user,
        details: { email: user.email },
      });

      return res.json({
        success: true,
        message: 'Vui lòng kiểm tra email để nhập mã OTP xác thực đăng nhập.',
        requiresVerification: true,
        email: user.email,
      });
    }

    return res.json(await authResponse(user));
  } catch (error) {
    console.error('Google login error:', error);
    return res.status(502).json({ message: 'Không thể xác minh Google. Vui lòng thử lại.' });
  }
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
    html: otpEmailTemplate({
      title: 'Đặt lại mật khẩu Mộc Mạc',
      subtitle: 'Bạn đã yêu cầu đặt lại mật khẩu. Mã OTP xác thực của bạn là:',
      otp,
    }),
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

  return res.json({ success: true, message: 'Đặt lại mật khẩu thành công.', ...(await authResponse(user)) });
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
