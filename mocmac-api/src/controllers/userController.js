import { User } from '../models/User.js';

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).lean();
    return res.json({ success: true, total: users.length, users });
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
    return res.json({ success: true, message: 'Xóa người dùng thành công.' });
  } catch (error) {
    console.error('❌ Lỗi xóa người dùng:', error);
    return res.status(500).json({ success: false, message: 'Không thể xóa.', error: error.message });
  }
};
