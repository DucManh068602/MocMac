import { Review } from '../models/Review.js';
import { Product } from '../models/Product.js';

export const getProductReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.id, status: 'visible' })
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .lean();

    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    return res.json({
      success: true,
      total: reviews.length,
      avgRating: Number(avgRating.toFixed(1)),
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
      productDoc = await Product.findById(productId);
    } else if (slug) {
      productDoc = await Product.findOne({ slug });
    }

    if (!productDoc) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm.' });
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

    return res.status(201).json({ success: true, message: 'Đánh giá thành công.', review });
  } catch (error) {
    console.error('❌ Lỗi tạo đánh giá:', error);
    return res.status(500).json({ success: false, message: 'Không thể đánh giá.', error: error.message });
  }
};

export const getAllReviews = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      Review.find()
        .populate('product', 'name')
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments(),
    ]);

    return res.json({
      success: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      reviews,
    });
  } catch (error) {
    console.error('❌ Lỗi lấy tất cả đánh giá:', error);
    return res.status(500).json({ success: false, message: 'Không thể lấy.', error: error.message });
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

export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá.' });
    }
    return res.json({ success: true, message: 'Xóa đánh giá thành công.' });
  } catch (error) {
    console.error('❌ Lỗi xóa đánh giá:', error);
    return res.status(500).json({ success: false, message: 'Không thể xóa.', error: error.message });
  }
};
