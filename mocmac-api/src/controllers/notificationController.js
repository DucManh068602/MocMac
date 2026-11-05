import { Notification } from '../models/Notification.js';
import { io, userSocketMap } from '../index.js';
import { logAction, getRequestInfo } from '../utils/auditLog.js';

export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      Notification.find({ recipient: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments({ recipient: userId }),
    ]);

    return res.json({
      success: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      notifications,
    });
  } catch (error) {
    console.error('❌ Lỗi lấy thông báo người dùng:', error);
    return res.status(500).json({ success: false, message: 'Không thể lấy thông báo.', error: error.message });
  }
};

export const getAllNotifications = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Number(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.query.q) {
      filter.$or = [
        { title: new RegExp(String(req.query.q), 'i') },
        { content: new RegExp(String(req.query.q), 'i') },
      ];
    }

    if (req.query.type) {
      filter.type = String(req.query.type);
    }

    if (req.query.isRead !== undefined) {
      filter.isRead = req.query.isRead === 'true';
    }

    if (req.query.sent !== undefined) {
      filter.sent = req.query.sent === 'true';
    }

    const sort = {};
    const sortBy = String(req.query.sortBy || 'createdAt');
    const sortDir = req.query.sortDir === 'asc' ? 1 : -1;
    sort[sortBy] = sortDir;

    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .populate('recipient', 'name email')
        .populate('orderId', 'total status')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      notifications,
    });
  } catch (error) {
    console.error('❌ Lỗi lấy thông báo:', error);
    return res.status(500).json({ success: false, message: 'Không thể lấy thông báo.', error: error.message });
  }
};

export const getNotificationById = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)
      .populate('recipient', 'name email')
      .populate('orderId', 'total status')
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

export const markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, isRead: false },
      { $set: { isRead: true } }
    );
    return res.json({ success: true, message: 'Đã đánh dấu tất cả đã đọc.' });
  } catch (error) {
    console.error('❌ Lỗi cập nhật thông báo:', error);
    return res.status(500).json({ success: false, message: 'Không thể cập nhật.', error: error.message });
  }
};

export const markAllNotificationsReadAll = async (req, res) => {
  try {
    await Notification.updateMany(
      { isRead: false },
      { $set: { isRead: true } }
    );
    return res.json({ success: true, message: 'Đã đánh dấu tất cả thông báo đã đọc.' });
  } catch (error) {
    console.error('❌ Lỗi cập nhật thông báo:', error);
    return res.status(500).json({ success: false, message: 'Không thể cập nhật.', error: error.message });
  }
};

export const createNotification = async (req, res) => {
  try {
    const { title, content, type = 'system', recipient = null, orderId = null, link = '' } = req.body ?? {};

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập tiêu đề và nội dung.' });
    }

    const notification = await Notification.create({ title, content, type, recipient, orderId, link });

    const { user, ip } = getRequestInfo(req);
    await logAction({
      action: 'notification.create',
      resourceType: 'Notification',
      resourceId: notification._id,
      user,
      ip,
      details: { title, type, recipient: recipient || 'all' },
    });

    return res.status(201).json({ success: true, message: 'Tạo thông báo thành công.', notification });
  } catch (error) {
    console.error('❌ Lỗi tạo thông báo:', error);
    return res.status(500).json({ success: false, message: 'Không thể tạo.', error: error.message });
  }
};

export const sendNotification = async (req, res) => {
  try {
    const { title, content, type = 'system', recipient = null, link = '' } = req.body ?? {};

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập tiêu đề và nội dung.' });
    }

    const payload = { title, content, type, link, createdAt: new Date() };

    if (recipient) {
      const recipientId = String(recipient);
      const socketId = userSocketMap.get(recipientId);
      if (socketId) {
        io.to(socketId).emit('notification', payload);
      }
    } else {
      io.emit('notification', payload);
    }

    const notification = await Notification.create({
      title, content, type, recipient, link,
      sent: true,
      sentAt: new Date(),
    });

    const { user, ip } = getRequestInfo(req);
    await logAction({
      action: 'notification.send',
      resourceType: 'Notification',
      resourceId: notification._id,
      user,
      ip,
      details: { title, type, recipient: recipient || 'all' },
    });

    return res.status(201).json({ success: true, message: 'Gửi thông báo thành công.', notification });
  } catch (error) {
    console.error('❌ Lỗi gửi thông báo:', error);
    return res.status(500).json({ success: false, message: 'Không thể gửi.', error: error.message });
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
