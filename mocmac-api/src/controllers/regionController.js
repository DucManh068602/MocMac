import { Region } from '../models/Region.js';
import { Product } from '../models/Product.js';

export const getAllRegions = async (req, res) => {
  const regions = await Region.find().sort({ name: 1 }).lean();

  const regionsWithCount = await Promise.all(
    regions.map(async (r) => {
      const count = await Product.countDocuments({ region: r.name });
      return { ...r, productCount: count };
    })
  );

  res.json(regionsWithCount);
};

export const getRegionBySlug = async (req, res) => {
  const region = await Region.findOne({ slug: req.params.slug }).lean();
  if (!region) {
    return res.status(404).json({ message: 'Không tìm thấy vùng miền' });
  }

  const products = await Product.find({ region: region.name }).lean();
  res.json({ ...region, products });
};
