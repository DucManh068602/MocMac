import { AuditLog } from '../models/AuditLog.js';

export const getAllAuditLogs = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.action) filter.action = String(req.query.action);
    if (req.query.resourceType) filter.resourceType = String(req.query.resourceType);
    if (req.query.status) filter.status = String(req.query.status);
    if (req.query.userId) filter.userId = req.query.userId;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('userId', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    return res.json({ success: true, total, page, limit, totalPages: Math.ceil(total / limit), logs });
  } catch (error) {
    console.error('Lỗi lấy audit log:', error);
    return res.status(500).json({ success: false, message: 'Không thể lấy lịch sử hệ thống.', error: error.message });
  }
};

export const getAuditStats = async (req, res) => {
  try {
    const [total, today, actions] = await Promise.all([
      AuditLog.countDocuments(),
      AuditLog.countDocuments({ createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
      AuditLog.aggregate([
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ]);
    return res.json({ success: true, total, today, topActions: actions });
  } catch (error) {
    console.error('Lỗi lấy thống kê audit log:', error);
    return res.status(500).json({ success: false, message: 'Không thể lấy thống kê.', error: error.message });
  }
};

export const clearAuditLogs = async (_req, res) => {
  try {
    const result = await AuditLog.deleteMany({});
    return res.json({ success: true, message: `Đã xóa ${result.deletedCount} bản ghi lịch sử.`, deletedCount: result.deletedCount });
  } catch (error) {
    console.error('Lỗi xóa audit log:', error);
    return res.status(500).json({ success: false, message: 'Không thể xóa lịch sử.', error: error.message });
  }
};