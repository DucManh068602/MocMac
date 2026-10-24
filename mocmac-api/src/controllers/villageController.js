import { Product } from '../models/Product.js';

export const getVillages = async (req, res) => {
  try {
    const villages = await Product.distinct('village', {
      village: { $exists: true, $ne: '' },
    });
    res.json(villages.sort());
  } catch (error) {
    console.error('❌ Lỗi lấy làng nghề:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};
