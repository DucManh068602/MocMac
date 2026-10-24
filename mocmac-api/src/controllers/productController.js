import { Product } from '../models/Product.js';
import { Review } from '../models/Review.js';
import { logAction, getRequestInfo } from '../utils/auditLog.js';

export const getAllProducts = async (req, res) => {
  const filter = {};
  if (req.query.cat) filter.cat = String(req.query.cat);

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 50));
  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    Product.find(filter).sort({ id: 1 }).skip(skip).limit(limit).lean(),
    Product.countDocuments(filter),
  ]);

  res.json({
    success: true,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    products,
  });
};

export const getProductBySlug = async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug }).lean();
  if (!product) {
    return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
  }

  const reviews = await Review.find({ product: product._id, status: 'visible' })
    .populate('user', 'name')
    .sort({ createdAt: -1 })
    .lean();

  const avgRating = reviews.length > 0
    ? Number((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1))
    : 0;

  res.json({
    ...product,
    avgRating,
    reviews,
  });
};

export const createProduct = async (req, res) => {
  const body = { ...req.body };
  if (body.id == null) {
    const last = await Product.findOne().sort({ id: -1 }).select({ id: 1 }).lean();
    body.id = last ? last.id + 1 : 1;
  }
  const product = await Product.create(body);

  const { user, ip } = getRequestInfo(req);
  await logAction({
    action: 'product.create',
    resourceType: 'Product',
    resourceId: product._id,
    user,
    ip,
    details: { name: product.name, slug: product.slug, price: product.price },
  });

  res.status(201).json(product);
};

export const updateProduct = async (req, res) => {
  const product = await Product.findOneAndUpdate(
    { slug: req.params.slug },
    req.body,
    { new: true, runValidators: true }
  ).lean();
  if (!product) {
    return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
  }

  const { user, ip } = getRequestInfo(req);
  await logAction({
    action: 'product.update',
    resourceType: 'Product',
    resourceId: product._id,
    user,
    ip,
    details: { slug: product.slug },
  });

  res.json(product);
};

export const deleteProduct = async (req, res) => {
  const product = await Product.findOneAndDelete({ slug: req.params.slug });
  if (!product) {
    return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
  }
  res.json({ message: 'Đã xóa sản phẩm' });
};
