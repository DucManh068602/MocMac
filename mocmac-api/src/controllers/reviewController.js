import { Review } from '../models/Review.js';
import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { logAction, getRequestInfo } from '../utils/auditLog.js';

async function updateProductStats(productId) {
  const stats = await Review.aggregate([
    { $match: { product: productId, status: 'visible' } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  const avgRating = stats[0]?.avg ? Number(stats[0].avg.toFixed(1)) : 0;
  const numReviews = stats[0]?.count || 0;

  await Product.findByIdAndUpdate(productId, { avgRating, numReviews, rate: avgRating, reviews: numReviews });
}

export const getProductReviews = async (req, res) => {
  try {
    const product = await Product.findOne({ id: Number(req.params.id) }).lean();
    let reviews = [];
    let total = 0;
    let avgRating = 0;

    if (product) {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 20));
      const skip = (page - 1) * limit;

      const [productReviews, count] = await Promise.all([
        Review.find({ product: product._id, status: 'visible' })
          .populate('user', 'name')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Review.countDocuments({ product: product._id, status: 'visible' }),
      ]);

      reviews = productReviews;
      total = count;
      avgRating = reviews.length > 0
        ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1))
        : 0;
    }

    return res.json({
      success: true,
      total,
      page: product ? (Math.max(1, Number(req.query.page) || 1)) : 1,
      limit: product ? (Math.max(1, Math.min(100, Number(req.query.limit) || 20))) : 0,
      totalPages: product ? Math.ceil(total / (Math.max(1, Math.min(100, Number(req.query.limit) || 20)))) : 0,
      avgRating,
      reviews,
    });
  } catch (error) {
    console.error('❌ Lỗi lấy đánh giá:', error);
    return res.status(500).json({ success: false, message: 'Không thể lấy đánh giá.', error: error.message });
  }
};

export const createReview = async (req, res) => {
  try {
    const { productId, slug, rating, comment } = req.body ?? {};

    if (!rating || (!productId && !slug)) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn sản phẩm và đánh giá.' });
    }

    let productDoc = null;
    if (productId) {
      productDoc = await Product.findOne({ id: productId });
    } else if (slug) {
      productDoc = await Product.findOne({ slug });
    }

    if (!productDoc) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm.' });
    }

    const hasReceivedOrder = await Order.exists({
      user: req.user.id,
      status: 'delivered',
      'items.productId': productDoc.id,
    });

    if (!hasReceivedOrder) {
      return res.status(403).json({
        success: false,
        message: 'Bạn chỉ có thể đánh giá sản phẩm sau khi đã nhận hàng.',
      });
    }

    const existing = await Review.findOne({ product: productDoc._id, user: req.user.id });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Bạn đã đánh giá sản phẩm này rồi.' });
    }

    const review = await Review.create({
      product: productDoc._id,
      user: req.user.id,
      rating: Number(rating),
      comment: String(comment || ''),
    });

    await updateProductStats(productDoc._id);

    const { user, ip } = getRequestInfo(req);
    await logAction({
      action: 'review.create',
      resourceType: 'Review',
      resourceId: review._id,
      user,
      ip,
      details: { product: productDoc._id, rating: Number(rating), comment: String(comment || '').slice(0, 100) },
    });

    return res.status(201).json({ success: true, message: 'Đánh giá thành công.', review });
  } catch (error) {
    console.error('❌ Lỗi tạo đánh giá:', error);
    return res.status(500).json({ success: false, message: 'Không thể đánh giá.', error: error.message });
  }
};

export const getAllReviews = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Number(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.query.q) {
      const search = String(req.query.q);
      filter.$or = [
        { 'product.name': new RegExp(search, 'i') },
        { 'user.name': new RegExp(search, 'i') },
        { 'user.email': new RegExp(search, 'i') },
        { comment: new RegExp(search, 'i') },
      ];
    }

    if (req.query.rating) {
      const r = Number(req.query.rating);
      if (!isNaN(r) && r >= 1 && r <= 5) {
        filter.rating = r;
      }
    }

    if (req.query.status) {
      filter.status = String(req.query.status);
    }

    if (req.query.productId) {
      filter.product = req.query.productId;
    }

    if (req.query.userId) {
      filter.user = req.query.userId;
    }

    const sort = {};
    const sortBy = String(req.query.sortBy || 'createdAt');
    const sortDir = req.query.sortDir === 'asc' ? 1 : -1;
    sort[sortBy] = sortDir;

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate('product', 'name')
        .populate('user', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments(filter),
    ]);

    const reviewsWithProductName = reviews.map((r) => {
      const p = r.product;
      const name =
        p && typeof p === 'object' && p.name
          ? p.name
          : null;
      const ref = !name && p ? String(p._id || p) : '';
      return {
        ...r,
        productName: name || (ref ? `Sản phẩm không còn tồn tại (${ref.slice(-6)})` : '—'),
      };
    });

    return res.json({
      success: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      reviews: reviewsWithProductName,
    });
  } catch (error) {
    console.error('❌ Lỗi lấy tất cả đánh giá:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể lấy.',
      error: error.message,
    });
  }
};

export const updateReviewStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { status: status === 'hidden' ? 'hidden' : 'visible' },
      { new: true }
    ).lean();

    if (!review) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá.' });
    }
    return res.json({ success: true, message: 'Cập nhật trạng thái.', review });
  } catch (error) {
    console.error('❌ Lỗi cập nhật đánh giá:', error);
    return res.status(500).json({ success: false, message: 'Không thể cập nhật.', error: error.message });
  }
};

export const adminReplyReview = async (req, res) => {
  try {
    const { reply } = req.body ?? {};
    if (!reply || String(reply).trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập nội dung phản hồi.' });
    }

    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { adminReply: String(reply).trim() },
      { new: true }
    ).lean();

    if (!review) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá.' });
    }

    return res.json({ success: true, message: 'Đã phản hồi đánh giá.', review });
  } catch (error) {
    console.error('Lỗi phản hồi đánh giá:', error);
    return res.status(500).json({ success: false, message: 'Không thể phản hồi.', error: error.message });
  }
};
