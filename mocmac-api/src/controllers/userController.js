import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Order } from '../models/Order.js';
import { QuotationRequest } from '../models/QuotationRequest.js';
import { resolveTier } from '../utils/membership.js';
import { logAction, getRequestInfo } from '../utils/auditLog.js';

async function attachMembership(users) {
  const list = Array.isArray(users) ? users : [users];
  if (!list.length) return users;
  const ids = list.map((u) => u._id).filter(Boolean);
  const emails = list.map((u) => String(u.email || '').toLowerCase().trim()).filter(Boolean);
  const [orderAgg, quoteAgg] = await Promise.all([
    Order.aggregate([
      { $match: { user: { $in: ids }, status: { $ne: 'cancelled' }, paymentStatus: { $ne: 'failed' } } },
      { $group: { _id: '$user', spend: { $sum: { $ifNull: ['$total', 0] } }, count: { $sum: 1 } } },
    ]),
    QuotationRequest.aggregate([
      { $match: { email: { $in: emails }, paymentStatus: 'paid', status: { $in: ['accepted', 'done'] } } },
      { $group: { _id: '$email', spend: { $sum: { $ifNull: ['$quotedTotal', { $ifNull: ['$totalEstimate', 0] }] } }, count: { $sum: 1 } } },
    ]),
  ]);
  const orderMap = new Map(orderAgg.map((r) => [String(r._id), r]));
  const quoteMap = new Map(quoteAgg.map((r) => [String(r._id || '').toLowerCase().trim(), r]));
  for (const u of list) {
    const o = orderMap.get(String(u._id)) || {};
    const q = quoteMap.get(String(u.email || '').toLowerCase().trim()) || {};
    const orderSpend = Number(o.spend) || 0;
    const giftSpend = Number(q.spend) || 0;
    const tier = resolveTier(orderSpend + giftSpend);
    u.membership = { tierKey: tier.currentTier.key, tierName: tier.currentTier.name, tierColor: tier.currentTier.color, totalSpend: tier.totalSpend, orderSpend, giftSpend, orderCount: Number(o.count) || 0, paidGiftCount: Number(q.count) || 0, nextTier: tier.nextTier?.name || null, amountToNext: tier.amountToNext };
  }
  return users;
}

export const getAllUsers = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Number(req.query.limit) || 20);
    const skip = (page - 1) * limit;
    const filter = {};
    if (req.query.q) {
      const search = String(req.query.q);
      filter.$or = [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];
    }
    if (req.query.role) {
      const roles = ['admin', 'staff', 'collaborator', 'cooperative', 'customer'];
      const roleParam = String(req.query.role);
      if (roles.includes(roleParam)) filter.role = roleParam;
      else if (roleParam === 'admin-staff') filter.role = { $in: ['admin', 'staff'] };
    }
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
    const sort = {};
    sort[String(req.query.sortBy || 'createdAt')] = req.query.sortDir === 'asc' ? 1 : -1;
    const [users, total] = await Promise.all([
      User.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
    ]);
    await attachMembership(users);
    return res.json({ success: true, total, page, limit, totalPages: Math.ceil(total / limit), users });
  } catch (error) {
    console.error('Lỗi lấy danh sách người dùng:', error);
    return res.status(500).json({ success: false, message: 'Không thể lấy danh sách.', error: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).lean();
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
    await attachMembership(user);
    return res.json({ success: true, user });
  } catch (error) {
    console.error('Lỗi lấy thông tin người dùng:', error);
    return res.status(500).json({ success: false, message: 'Không thể lấy thông tin.', error: error.message });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const allowedRoles = ['admin', 'staff', 'collaborator', 'cooperative', 'customer'];
    if (!allowedRoles.includes(role)) return res.status(400).json({ success: false, message: 'Vai trò không hợp lệ.' });
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true, runValidators: true }).lean();
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
    const { user: reqUser, ip } = getRequestInfo(req);
    await logAction({ action: 'user.role_update', resourceType: 'User', resourceId: user._id, user: reqUser, ip, details: { targetUserId: user._id, email: user.email, newRole: role } });
    await attachMembership(user);
    return res.json({ success: true, message: 'Cập nhật vai trò thành công.', user });
  } catch (error) {
    console.error('Lỗi cập nhật vai trò:', error);
    return res.status(500).json({ success: false, message: 'Không thể cập nhật.', error: error.message });
  }
};

const upgradeRoles = ['customer', 'collaborator', 'cooperative', 'staff', 'admin'];
const roleEmailSuffix = { admin: 'admin.mocmac.vn', staff: 'staff.mocmac.vn', collaborator: 'contr.mocmac.vn', cooperative: 'htx.mocmac.vn' };

export const activateUser = async (req, res) => {
  try {
    const { role } = req.body;
    if (!role || !upgradeRoles.includes(role)) return res.status(400).json({ success: false, message: `Vai trò kích hoạt không hợp lệ. Chọn một trong: ${upgradeRoles.join(', ')}.` });
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
    if (role === 'customer') {
      if (user.originalEmail) user.email = user.originalEmail;
      user.role = 'customer'; user.isActive = true; await user.save();
      const { user: reqUser, ip } = getRequestInfo(req);
      await logAction({ action: 'user.activate', resourceType: 'User', resourceId: user._id, user: reqUser, ip, details: { targetUserId: user._id, email: user.email, newRole: role } });
      const out = user.toObject ? user.toObject() : user; await attachMembership(out);
      return res.json({ success: true, message: 'Kích hoạt người dùng thành công.', user: out });
    }
    if (!user.originalEmail) user.originalEmail = user.email;
    const localPart = String(user.originalEmail).split('@')[0];
    const suffix = roleEmailSuffix[role];
    if (!suffix) return res.status(400).json({ success: false, message: 'Vai trò không hợp lệ.' });
    const newEmail = `${localPart}@${suffix}`;
    if (newEmail !== user.email) {
      const exists = await User.exists({ email: newEmail });
      if (exists) return res.status(409).json({ success: false, message: `Email ${newEmail} đã được sử dụng.` });
      user.email = newEmail;
    }
    user.role = role; user.isActive = true; await user.save();
    const { user: reqUser, ip } = getRequestInfo(req);
    await logAction({ action: 'user.activate', resourceType: 'User', resourceId: user._id, user: reqUser, ip, details: { targetUserId: user._id, email: user.email, newRole: role } });
    const out = user.toObject ? user.toObject() : user; await attachMembership(out);
    return res.json({ success: true, message: 'Kích hoạt người dùng thành công.', user: out });
  } catch (error) {
    console.error('Lỗi kích hoạt người dùng:', error);
    return res.status(500).json({ success: false, message: 'Không thể kích hoạt.', error: error.message });
  }
};

export const deactivateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
    if (user.email === 'admin@admin.mocmac.vn') return res.status(403).json({ success: false, message: 'Không thể vô hiệu tài khoản quản trị cấp cao.' });
    if (!user.originalEmail) user.originalEmail = user.email;
    user.isActive = false; user.role = 'customer';
    if (user.originalEmail) {
      const restoredEmail = user.originalEmail.toLowerCase().trim();
      const exists = await User.exists({ email: restoredEmail, _id: { $ne: user._id } });
      if (!exists) user.email = restoredEmail;
    }
    await user.save();
    const { user: reqUser, ip } = getRequestInfo(req);
    await logAction({ action: 'user.deactivate', resourceType: 'User', resourceId: user._id, user: reqUser, ip, details: { targetUserId: user._id, email: user.email, role: user.role } });
    const out = user.toObject ? user.toObject() : user; await attachMembership(out);
    return res.json({ success: true, message: 'Hủy kích hoạt người dùng thành công.', user: out });
  } catch (error) {
    console.error('Lỗi hủy kích hoạt người dùng:', error);
    return res.status(500).json({ success: false, message: 'Không thể hủy kích hoạt.', error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
    if (user.email === 'admin@admin.mocmac.vn') return res.status(403).json({ success: false, message: 'Không thể xóa tài khoản quản trị cấp cao.' });
    await user.deleteOne();
    const { user: reqUser, ip } = getRequestInfo(req);
    await logAction({ action: 'user.delete', resourceType: 'User', resourceId: user._id, user: reqUser, ip, details: { email: user.email, role: user.role } });
    return res.json({ success: true, message: 'Xóa người dùng thành công.' });
  } catch (error) {
    console.error('Lỗi xóa người dùng:', error);
    return res.status(500).json({ success: false, message: 'Không thể xóa.', error: error.message });
  }
};

export const createUser = async (req, res) => {
  try {
    const { name, email, phone, password, role = 'customer', isActive = true } = req.body ?? {};
    if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ tên, email và mật khẩu.' });
    if (String(password).length < 8) return res.status(400).json({ success: false, message: 'Mật khẩu tối thiểu 8 ký tự.' });
    const allowedRoles = ['admin', 'staff', 'collaborator', 'cooperative', 'customer'];
    if (!allowedRoles.includes(role)) return res.status(400).json({ success: false, message: 'Vai trò không hợp lệ.' });
    const exists = await User.exists({ email: String(email).toLowerCase() });
    if (exists) return res.status(409).json({ success: false, message: 'Email đã được sử dụng.' });
    const user = await User.create({ name: String(name).trim(), email: String(email).toLowerCase().trim(), phone: String(phone || '').trim(), passwordHash: await bcrypt.hash(String(password), 10), role, isActive });
    const { user: reqUser, ip } = getRequestInfo(req);
    await logAction({ action: 'user.create', resourceType: 'User', resourceId: user._id, user: reqUser, ip, details: { email: user.email, role: user.role } });
    const out = user.toObject ? user.toObject() : user; await attachMembership(out);
    return res.status(201).json({ success: true, message: 'Tạo tài khoản thành công.', user: out });
  } catch (error) {
    console.error('Lỗi tạo người dùng:', error);
    return res.status(500).json({ success: false, message: 'Không thể tạo.', error: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { name, phone, role, isActive, password } = req.body ?? {};
    const allowedRoles = ['admin', 'staff', 'collaborator', 'cooperative', 'customer'];
    if (role && !allowedRoles.includes(role)) return res.status(400).json({ success: false, message: 'Vai trò không hợp lệ.' });
    const update = {};
    if (name) update.name = String(name).trim();
    if (phone !== undefined) update.phone = String(phone).trim();
    if (role) update.role = role;
    if (isActive !== undefined) update.isActive = isActive;
    if (password) {
      if (String(password).length < 8) return res.status(400).json({ success: false, message: 'Mật khẩu tối thiểu 8 ký tự.' });
      update.passwordHash = await bcrypt.hash(String(password), 10);
    }
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true }).lean();
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
    const { user: reqUser, ip } = getRequestInfo(req);
    await logAction({ action: 'user.update', resourceType: 'User', resourceId: user._id, user: reqUser, ip, details: { email: user.email, role: user.role, isActive: user.isActive } });
    await attachMembership(user);
    return res.json({ success: true, message: 'Cập nhật tài khoản thành công.', user });
  } catch (error) {
    console.error('Lỗi cập nhật người dùng:', error);
    return res.status(500).json({ success: false, message: 'Không thể cập nhật.', error: error.message });
  }
};

export const getMyMembership = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const email = String(req.user?.email || '').toLowerCase().trim();
    const [orders, paidQuotations, pendingQuotations] = await Promise.all([
      Order.find({ user: userId, status: { $ne: 'cancelled' }, paymentStatus: { $ne: 'failed' } }).select('total createdAt status paymentStatus').lean(),
      email ? QuotationRequest.find({ email, paymentStatus: 'paid', status: { $in: ['accepted', 'done'] } }).select('quotedTotal totalEstimate').lean() : Promise.resolve([]),
      email ? QuotationRequest.find({ email, status: { $in: ['accepted', 'quoted'] }, paymentStatus: { $ne: 'paid' } }).select('_id').lean() : Promise.resolve([]),
    ]);
    const orderSpend = orders.reduce((s, o) => s + Math.max(0, Number(o.total) || 0), 0);
    const giftSpend = paidQuotations.reduce((s, q) => s + Math.max(0, Number(q.quotedTotal || q.totalEstimate) || 0), 0);
    const membership = resolveTier(orderSpend + giftSpend);
    return res.json({
      success: true,
      membership: {
        ...membership,
        orderSpend,
        giftSpend,
        orderCount: orders.length,
        paidGiftCount: paidQuotations.length,
        pendingGiftCount: pendingQuotations.length,
      },
    });
  } catch (error) {
    console.error('Membership error:', error);
    return res.status(500).json({ success: false, message: 'Không thể tải hạng hội viên.' });
  }
};

export const updateMyProfile = async (req, res) => {
  try {
    const { name, phone } = req.body ?? {};
    const update = {};
    if (name !== undefined) update.name = String(name).trim();
    if (phone !== undefined) update.phone = String(phone).trim();
    const userId = req.user?._id || req.user?.id;
    const user = await User.findByIdAndUpdate(userId, update, { new: true, runValidators: true }).lean();
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
    const { user: reqUser, ip } = getRequestInfo(req);
    await logAction({ action: 'user.update_profile', resourceType: 'User', resourceId: user._id, user: reqUser, ip, details: { email: user.email, name: user.name, phone: user.phone } });
    return res.json({ success: true, message: 'Cập nhật hồ sơ thành công.', user });
  } catch (error) {
    console.error('Lỗi cập nhật hồ sơ:', error);
    return res.status(500).json({ success: false, message: 'Không thể cập nhật hồ sơ.', error: error.message });
  }
};


export const getMyProfile = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const user = await User.findById(userId).select('name email phone role isActive').lean();
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
    return res.json({ success: true, user });
  } catch (error) {
    console.error('Lỗi lấy hồ sơ:', error);
    return res.status(500).json({ success: false, message: 'Không thể tải hồ sơ.', error: error.message });
  }
};
