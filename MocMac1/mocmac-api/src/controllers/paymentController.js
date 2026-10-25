import crypto from 'crypto';
import { Order } from '../models/Order.js';
import { Payment } from '../models/Payment.js';
import { Coupon } from '../models/Coupon.js';
import { createMoMoPayment, callMoMoApi } from '../utils/momo.js';
import { generateOrderId, initStatusHistory, appendStatusHistory } from '../utils/orderUtils.js';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4200';

export const createPayment = async (req, res) => {
  try {
    const { items, subtotal, discount = 0, shipping = 0, total, paymentMethod = 'cod', customerInfo, note = '', couponCode = '' } = req.body ?? {};

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Đơn hàng phải có ít nhất một sản phẩm.' });
    }

     if (typeof total !== 'number' || total < 0) {
      return res.status(400).json({ success: false, message: 'Tổng đơn hàng không hợp lệ.' });
    }

    if (couponCode) {
      const couponDoc = await Coupon.findOne({ code: String(couponCode).toUpperCase() });
      if (couponDoc) {
        await Coupon.updateOne(
          { code: couponDoc.code },
          { $inc: { usedCount: 1 } }
        );
      }
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

    if (paymentMethod === 'cod') {
      const payment = await Payment.create({
        order: order._id,
        user: req.user ? req.user.id : null,
        amount: total,
        method: 'cod',
        status: 'pending',
        couponCode,
        discountAmount: discount,
      });
      order.paymentId = payment._id;
      order.paymentStatus = 'pending';
      await order.save();

      return res.status(201).json({
        success: true,
        message: 'Đặt hàng thành công. Thanh toán khi nhận hàng.',
        order,
        payment,
      });
    }

    if (paymentMethod === 'momo') {
      const orderInfo = `Mộc Mạc - Đơn #${order._id.toString().slice(-8)}`;
      const extraData = Buffer.from(JSON.stringify({ orderId: order._id.toString() })).toString('base64');

      const momoPayload = createMoMoPayment(total, orderInfo, extraData);
      const momoResponse = await callMoMoApi(momoPayload);

      let payUrl = momoResponse.payUrl || '';
      let status = 'pending';

      if (momoResponse.resultCode === 0 && momoResponse.payUrl) {
        status = 'pending';
      } else {
        status = 'failed';
      }

      const payment = await Payment.create({
        order: order._id,
        user: req.user ? req.user.id : null,
        amount: total,
        method: 'momo',
        status,
        transactionId: momoResponse.orderId || '',
        payUrl,
        note: orderInfo,
        couponCode,
        discountAmount: discount,
      });

      order.paymentId = payment._id;
      order.paymentStatus = status;
      await order.save();

      return res.status(201).json({
        success: true,
        message: 'Tạo đơn hàng thành công. Chuyển hướng đến MoMo.',
        order,
        payment,
        payUrl,
      });
    }

    return res.status(400).json({ success: false, message: 'Phương thức thanh toán không hỗ trợ.' });
  } catch (error) {
    console.error('❌ Lỗi tạo thanh toán:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể tạo thanh toán. Vui lòng thử lại.',
      error: error.message,
    });
  }
};

export const momoCallback = async (req, res) => {
  try {
    const { resultCode, orderId, amount, extraData } = req.body;

    let orderIdStr = '';
    if (extraData) {
      try {
        const decoded = Buffer.from(extraData, 'base64').toString('utf8');
        const parsed = JSON.parse(decoded);
        orderIdStr = parsed.orderId;
      } catch {}
    }

    if (orderIdStr) {
      const payment = await Payment.findOne({ transactionId: orderId }).exec();
      if (payment) {
        if (resultCode === 0) {
          payment.status = 'completed';
          await Payment.updateOne({ _id: payment._id }, { status: 'completed' });
          const order = await Order.findById(payment.order).exec();
          if (order) {
            order.paymentStatus = 'paid';
            appendStatusHistory(order, { paymentStatus: 'paid', note: 'Thanh toán MoMo thành công' });
            await order.save();
          } else {
            await Order.updateOne({ _id: payment.order }, { paymentStatus: 'paid' });
          }
        } else {
          payment.status = 'failed';
          await Payment.updateOne({ _id: payment._id }, { status: 'failed' });
          const order = await Order.findById(payment.order).exec();
          if (order) {
            order.paymentStatus = 'failed';
            appendStatusHistory(order, { paymentStatus: 'failed', note: 'Thanh toán MoMo thất bại' });
            await order.save();
          } else {
            await Order.updateOne({ _id: payment.order }, { paymentStatus: 'failed' });
          }
        }
      }
    }

    const redirect = resultCode === 0 ? '?status=success' : '?status=fail';
    return res.redirect(303, `${FRONTEND_URL}/gio-hang${redirect}`);
  } catch (error) {
    console.error('❌ Lỗi callback MoMo:', error);
    return res.redirect(303, `${FRONTEND_URL}/gio-hang?status=error`);
  }
};

export const momoIpn = async (req, res) => {
  try {
    const { resultCode, orderId, amount } = req.body;

    const payment = await Payment.findOne({ transactionId: orderId }).populate('order').exec();
    if (payment) {
       if (resultCode === 0) {
          payment.status = 'completed';
          await payment.save();
          if (payment.order) {
            payment.order.paymentStatus = 'paid';
            appendStatusHistory(payment.order, { paymentStatus: 'paid', note: 'Thanh toán MoMo thành công' });
            await payment.order.save();
          }
       } else {
         payment.status = 'failed';
         await payment.save();
       }
    }

    return res.status(200).json({ success: true, message: 'oke' });
  } catch (error) {
    console.error('❌ Lỗi IPN MoMo:', error);
    return res.status(200).json({ success: true, message: 'oke' });
  }
};

export const getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user.id })
      .populate('order', 'total status paymentMethod createdAt')
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      total: payments.length,
      payments,
    });
  } catch (error) {
    console.error('❌ Lỗi lấy lịch sử thanh toán:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể lấy lịch sử thanh toán.',
      error: error.message,
    });
  }
};

export const getPaymentStatus = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('order', 'total status paymentMethod')
      .lean();

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy giao dịch.' });
    }

    return res.json({ success: true, payment });
  } catch (error) {
    console.error('❌ Lỗi lấy trạng thái thanh toán:', error);
    return res.status(500).json({ success: false, message: 'Không thể lấy thông tin.', error: error.message });
  }
};
