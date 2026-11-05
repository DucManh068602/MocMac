import { Order } from '../models/Order.js';
import { logAction, getRequestInfo } from '../utils/auditLog.js';
import { generateOrderId, initStatusHistory, appendStatusHistory } from '../utils/orderUtils.js';

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
      orderId: generateOrderId(),
      items,
      subtotal,
      discount,
      shipping,
      total,
      paymentMethod,
      customerInfo: customerInfo ?? {},
      note: String(note || ''),
      statusHistory: initStatusHistory({ status: 'pending', paymentStatus: 'pending' }, 'Đơn hàng mới được tạo'),
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
    const limit = Math.max(1, Number(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.query.q) {
      const search = String(req.query.q);
      filter.$or = [
        { orderId: new RegExp(search, 'i') },
        { 'customerInfo.name': new RegExp(search, 'i') },
        { 'customerInfo.phone': new RegExp(search, 'i') },
      ];
    }

    if (req.query.status) {
      filter.status = String(req.query.status);
    }

    if (req.query.paymentStatus) {
      filter.paymentStatus = String(req.query.paymentStatus);
    }

    if (req.query.paymentMethod) {
      filter.paymentMethod = String(req.query.paymentMethod);
    }

    const sort = {};
    const sortBy = String(req.query.sortBy || 'createdAt');
    const sortDir = req.query.sortDir === 'asc' ? 1 : -1;
    sort[sortBy] = sortDir;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('user', 'name email phone')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
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

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng.',
      });
    }

    order.status = status;
    appendStatusHistory(order, { status, note: `Cập nhật trạng thái: ${status}` });
    await order.save();

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

export const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus } = req.body;

    const allowedPayment = ['pending', 'paid', 'failed', 'refunded'];
    if (!allowedPayment.includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái thanh toán không hợp lệ.',
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng.',
      });
    }

    order.paymentStatus = paymentStatus;
    appendStatusHistory(order, { paymentStatus, note: `Cập nhật thanh toán: ${paymentStatus}` });
    await order.save();

    const { user: reqUser, ip } = getRequestInfo(req);
    await logAction({
      action: 'order.payment_update',
      resourceType: 'Order',
      resourceId: order._id,
      user: reqUser,
      ip,
      details: { newPaymentStatus: paymentStatus },
    });

return res.json({
    success: true,
    message: 'Cập nhật trạng thái thanh toán thành công.',
    order,
  });
} catch (error) {
  console.error('❌ Lỗi cập nhật thanh toán:', error);
  return res.status(500).json({
    success: false,
    message: 'Không thể cập nhật thanh toán.',
    error: error.message,
  });
}
};

export const trackOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findOne({ orderId: orderId.toUpperCase() }).lean();
    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng.' });
    }
    // Return only public tracking info (hide sensitive data)
    return res.json({
      success: true,
      order: {
        orderId: order.orderId,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        total: order.total,
        statusHistory: order.statusHistory || [],
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        customerInfo: {
          name: order.customerInfo?.name,
          phone: order.customerInfo?.phone,
          address: order.customerInfo?.address,
        },
        items: order.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        subtotal: order.subtotal,
        discount: order.discount,
        shipping: order.shipping,
      },
    });
  } catch (error) {
    console.error('❌ Lỗi tra cứu đơn hàng:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể tra cứu đơn hàng.',
      error: error.message,
    });
  }
};

export const getMyOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user.id }).lean();
    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng.' });
    }
    return res.json({ success: true, order });
  } catch (error) {
    console.error('❌ Lỗi lấy chi tiết đơn hàng:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể lấy đơn hàng.',
      error: error.message,
    });
  }
};

export const checkCanReview = async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    if (!Number.isSafeInteger(productId) || productId <= 0) {
      return res.status(400).json({ success: false, message: 'ProductId không hợp lệ.' });
    }

    const delivered = await Order.exists({
      user: req.user.id,
      status: 'delivered',
      'items.productId': productId,
    });

    return res.json({ success: true, delivered: !!delivered });
  } catch (error) {
    console.error('❌ Lỗi kiểm tra quyền đánh giá:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể kiểm tra quyền đánh giá.',
      error: error.message,
    });
  }
};
