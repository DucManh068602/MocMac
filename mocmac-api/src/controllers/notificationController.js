import { Notification } from '../models/Notification.js';

export const getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find()
      .populate('recipient', 'name email')
      .populate('order', 'total status')
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, total: notifications.length, notifications });
  } catch (error) {
    console.error('❌ Lỗi lấy thông báo:', error);
    return res.status(500).json({ success: false, message: 'Không thể lấy thông báo.', error: error.message });
  }
};

export const getNotificationById = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)
      .populate('recipient', 'name email')
      .populate('order', 'total status')
      .lean();

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thông báo.' });
    }
    return res.json({ success: true, notification });
  } catch (error) {
    console.error('❌ Lỗi lấy chi tiết thông báo:', error);
    return res.status(500).json({ success: false, message: 'Không thể lấy thông tin.', error: error.message });
  }
};

export const createNotification = async (req, res) => {
  try {
    const { title, content, type = 'system', recipient = null, orderId = null, link = '' } = req.body ?? {};

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập tiêu đề và nội dung.' });
    }

    const notification = await Notification.create({ title, content, type, recipient, orderId, link });
    return res.status(201).json({ success: true, message: 'Tạo thông báo thành công.', notification });
  } catch (error) {
    console.error('❌ Lỗi tạo thông báo:', error);
    return res.status(500).json({ success: false, message: 'Không thể tạo.', error: error.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    ).lean();

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thông báo.' });
    }
    return res.json({ success: true, message: 'Đã đánh dấu đã đọc.', notification });
  } catch (error) {
    console.error('❌ Lỗi cập nhật thông báo:', error);
    return res.status(500).json({ success: false, message: 'Không thể cập nhật.', error: error.message });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thông báo.' });
    }
    return res.json({ success: true, message: 'Xóa thông báo thành công.' });
  } catch (error) {
    console.error('❌ Lỗi xóa thông báo:', error);
    return res.status(500).json({ success: false, message: 'Không thể xóa.', error: error.message });
  }
};
