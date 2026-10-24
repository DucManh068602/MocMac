import { Order } from '../models/Order.js';
import { logAction, getRequestInfo } from '../utils/auditLog.js';

export const createOrder = async (req, res) => {
  try {
    const {
      items,
      subtotal,
      discount = 0,
      shipping = 0,
      total,
      paymentMethod = 'cod',
      customerInfo,
      note = '',
    } = req.body ?? {};

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Đơn hàng phải có ít nhất một sản phẩm.',
      });
    }

    if (typeof total !== 'number' || total < 0) {
      return res.status(400).json({
        success: false,
        message: 'Tổng đơn hàng không hợp lệ.',
      });
    }

    const order = await Order.create({
      user: req.user ? req.user.id : null,
      items,
      subtotal,
      discount,
      shipping,
      total,
      paymentMethod,
      customerInfo: customerInfo ?? {},
      note: String(note || ''),
    });

    const { user, ip } = getRequestInfo(req);
    await logAction({
      action: 'order.create',
      resourceType: 'Order',
      resourceId: order._id,
      user,
      ip,
      details: { total, paymentMethod, itemCount: items.length },
    });

    return res.status(201).json({
      success: true,
      message: 'Đặt hàng thành công.',
      order,
    });
  } catch (error) {
    console.error('❌ Lỗi tạo đơn hàng:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể đặt hàng. Vui lòng thử lại.',
      error: error.message,
    });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find({ user: req.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments({ user: req.user.id }),
    ]);

    return res.json({
      success: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      orders,
    });
  } catch (error) {
    console.error('❌ Lỗi lấy đơn hàng:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách đơn hàng.',
      error: error.message,
    });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find()
        .populate('user', 'name email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(),
    ]);

    return res.json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      orders,
    });
  } catch (error) {
    console.error('❌ Lỗi lấy toàn bộ đơn hàng:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách đơn hàng.',
      error: error.message,
    });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatus = [
      'pending',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
    ];

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ.',
      });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng.',
      });
    }

    const { user: reqUser, ip } = getRequestInfo(req);
    await logAction({
      action: 'order.status_update',
      resourceType: 'Order',
      resourceId: order._id,
      user: reqUser,
      ip,
      details: { newStatus: status },
    });

    return res.json({
      success: true,
      message: 'Cập nhật trạng thái thành công.',
      order,
    });
  } catch (error) {
    console.error('❌ Lỗi cập nhật đơn hàng:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể cập nhật đơn hàng.',
      error: error.message,
    });
  }
};
