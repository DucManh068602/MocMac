import { Product } from '../models/Product.js';

export const getAllProducts = async (req, res) => {
  const filter = {};
  if (req.query.cat) filter.cat = String(req.query.cat);
  const products = await Product.find(filter).sort({ id: 1 }).lean();
  res.json(products);
};

export const getProductBySlug = async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug }).lean();
  if (!product) {
    return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
  }
  res.json(product);
};

export const createProduct = async (req, res) => {
  const product = await Product.create(req.body);
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
  res.json(product);
};

export const deleteProduct = async (req, res) => {
  const product = await Product.findOneAndDelete({ slug: req.params.slug });
  if (!product) {
    return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
  }
  res.json({ message: 'Đã xóa sản phẩm' });
};
