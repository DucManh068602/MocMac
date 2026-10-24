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
    const allowedRoles = ['admin', 'staff', 'collaborator', 'cooperative', 'customer'];
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

const upgradeRoles = ['collaborator', 'cooperative', 'staff', 'admin'];

const roleEmailSuffix = {
  admin: 'admin.mocmac.vn',
  staff: 'staff.mocmac.vn',
  collaborator: 'contr.mocmac.vn',
  cooperative: 'htx.mocmac.vn',
};

export const activateUser = async (req, res) => {
  try {
    const { role } = req.body;
    if (!role || !upgradeRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Vai trò kích hoạt không hợp lệ. Chọn một trong: ${upgradeRoles.join(', ')}.`,
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
    }

    if (!user.originalEmail) {
      user.originalEmail = user.email;
    }

    const localPart = String(user.originalEmail).split('@')[0];
    const suffix = roleEmailSuffix[role];
    const newEmail = `${localPart}@${suffix}`;

    if (newEmail !== user.email) {
      const exists = await User.exists({ email: newEmail });
      if (exists) {
        return res.status(409).json({ success: false, message: `Email ${newEmail} đã được sử dụng.` });
      }
      user.email = newEmail;
    }

    user.role = role;
    user.isActive = true;
    await user.save();

    const { user: reqUser, ip } = getRequestInfo(req);
    await logAction({
      action: 'user.activate',
      resourceType: 'User',
      resourceId: user._id,
      user: reqUser,
      ip,
      details: { targetUserId: user._id, email: user.email, newRole: role },
    });

    return res.json({ success: true, message: 'Kích hoạt người dùng thành công.', user });
  } catch (error) {
    console.error('❌ Lỗi kích hoạt người dùng:', error);
    return res.status(500).json({ success: false, message: 'Không thể kích hoạt.', error: error.message });
  }
};

export const deactivateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
    }

    user.isActive = false;
    if (user.originalEmail) {
      user.email = user.originalEmail;
    }
    await user.save();

    const { user: reqUser, ip } = getRequestInfo(req);
    await logAction({
      action: 'user.deactivate',
      resourceType: 'User',
      resourceId: user._id,
      user: reqUser,
      ip,
      details: { targetUserId: user._id, email: user.email, role: user.role },
    });

    return res.json({ success: true, message: 'Hủy kích hoạt người dùng thành công.', user });
  } catch (error) {
    console.error('❌ Lỗi hủy kích hoạt người dùng:', error);
    return res.status(500).json({ success: false, message: 'Không thể hủy kích hoạt.', error: error.message });
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
