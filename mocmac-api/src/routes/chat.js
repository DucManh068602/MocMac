import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ChatMessage } from '../models/ChatMessage.js';

const router = Router();

router.get('/conversations', requireAuth, requireRole('admin', 'staff'), async (req, res) => {
  try {
    const messages = await ChatMessage.find({
      $or: [
        { to: 'admin' },
        { from: 'admin' },
      ],
    }).sort({ createdAt: -1 }).lean();

    const conversations = new Map();
    for (const msg of messages) {
      const key = msg.from === 'admin' ? msg.to : msg.from;
      if (!conversations.has(key)) {
        conversations.set(key, {
          from: key,
          lastMessage: msg.message,
          lastAt: msg.createdAt,
          unread: 0,
        });
      }
    }

    const unreadCounts = await ChatMessage.aggregate([
      { $match: { to: 'admin', read: false } },
      { $group: { _id: '$from', count: { $sum: 1 } } },
    ]);
    const unreadMap = new Map(unreadCounts.map((u) => [u._id, u.count]));

    for (const data of conversations.values()) {
      data.unread = unreadMap.get(data.from) || 0;
    }

    const result = Array.from(conversations.values());
    result.sort((a, b) => new Date(b.lastAt) - new Date(a.lastAt));

    return res.json({ success: true, conversations: result });
  } catch (error) {
    console.error('❌ Lỗi lấy cuộc trò chuyện:', error);
    return res.status(500).json({ success: false, message: 'Không thể lấy cuộc trò chuyện.', error: error.message });
  }
});

router.get('/user-by-email', requireAuth, requireRole('admin', 'staff'), async (req, res) => {
  try {
    const email = String(req.query.email || '').trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp email.' });
    }

    const latest = await ChatMessage.findOne({ from: email, to: 'admin' })
      .sort({ createdAt: 1 })
      .lean();

    if (!latest) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
    }

    return res.json({ success: true, userId: email });
  } catch (error) {
    console.error('❌ Lỗi tìm kiếm người dùng theo email:', error);
    return res.status(500).json({ success: false, message: 'Không thể tìm kiếm.', error: error.message });
  }
});

router.get('/:userId', requireAuth, requireRole('admin', 'staff'), async (req, res) => {
  try {
    const { userId } = req.params;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 50));
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      ChatMessage.find({
        $or: [
          { from: userId, to: 'admin' },
          { from: 'admin', to: userId },
        ],
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ChatMessage.countDocuments({
        $or: [
          { from: userId, to: 'admin' },
          { from: 'admin', to: userId },
        ],
      }),
    ]);

    await ChatMessage.updateMany(
      { from: userId, to: 'admin', read: false },
      { $set: { read: true } },
    );

    return res.json({
      success: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      messages: messages.reverse(),
    });
  } catch (error) {
    console.error('❌ Lỗi lấy tin nhắn:', error);
    return res.status(500).json({ success: false, message: 'Không thể lấy tin nhắn.', error: error.message });
  }
});

export default router;
