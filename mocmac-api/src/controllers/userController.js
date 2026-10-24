import { User } from '../models/User.js';
import { logAction, getRequestInfo } from '../utils/auditLog.js';

export const getAllUsers = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(),
    ]);

    return res.json({
      success: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      users,
    });
  } catch (error) {
    console.error('❌ Lỗi lấy danh sách người dùng:', error);
    return res.status(500).json({ success: false, message: 'Không thể lấy danh sách.', error: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).lean();
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
    }
    return res.json({ success: true, user });
  } catch (error) {
    console.error('❌ Lỗi lấy thông tin người dùng:', error);
    return res.status(500).json({ success: false, message: 'Không thể lấy thông tin.', error: error.message });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const allowedRoles = ['admin', 'staff', 'customer'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Vai trò không hợp lệ.' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).lean();

    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
    }

    const { user: reqUser, ip } = getRequestInfo(req);
    await logAction({
      action: 'user.role_update',
      resourceType: 'User',
      resourceId: user._id,
      user: reqUser,
      ip,
      details: { targetUserId: user._id, email: user.email, newRole: role },
    });

    return res.json({ success: true, message: 'Cập nhật vai trò thành công.', user });
  } catch (error) {
    console.error('❌ Lỗi cập nhật vai trò:', error);
    return res.status(500).json({ success: false, message: 'Không thể cập nhật.', error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
    }

    const { user: reqUser, ip } = getRequestInfo(req);
    await logAction({
      action: 'user.delete',
      resourceType: 'User',
      resourceId: user._id,
      user: reqUser,
      ip,
      details: { email: user.email, role: user.role },
    });

    return res.json({ success: true, message: 'Xóa người dùng thành công.' });
  } catch (error) {
    console.error('❌ Lỗi xóa người dùng:', error);
    return res.status(500).json({ success: false, message: 'Không thể xóa.', error: error.message });
  }
};
