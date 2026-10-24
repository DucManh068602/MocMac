import { Province } from '../models/Province.js';
import { provinces as provinceData } from 'vietnam-address-data';

const REGION_MAP = {
  'Hà Nội': 'Bắc Bộ',
  'Bắc Ninh': 'Bắc Bộ',
  'Quảng Ninh': 'Đông Bắc',
  'Hải Phòng': 'Đông Bắc',
  'Hưng Yên': 'Bắc Bộ',
  'Vĩ Phúc': 'Bắc Bộ',
  'Bình Dương': 'Đông Nam Bộ',
  'Đồng Nai': 'Đông Nam Bộ',
  'TP. HCM': 'Đông Nam Bộ',
  'Tiền Giang': 'Đồng bằng sông Cửu Long',
  'Cần Thơ': 'Đồng bằng sông Cửu Long',
  'An Giang': 'Tây Nam Bộ',
  'Kiên Giang': 'Tây Nam Bộ',
  'Cà Mau': 'Tây Nam Bộ',
  'Bạc Liêu': 'Tây Nam Bộ',
  'Sóc Trăng': 'Tây Nam Bộ',
  'Bình Thuận': 'Nam Bộ',
  'Khánh Hòa': 'Nam Bộ',
  'Nha Trang': 'Nam Bộ',
  'Đà Nẵng': 'Miền Trung',
  'Hội An': 'Miền Trung',
  'Huế': 'Miền Trung',
  'Đắk Lắk': 'Tây Nguyên',
  'Đắk Nông': 'Tây Nguyên',
  'Lâm Đồng': 'Tây Nguyên',
  'Gia Lai': 'Tây Nguyên',
  'Pleiku': 'Tây Nguyên',
  'Kon Tum': 'Tây Nguyên',
  'Quảng Nam': 'Miền Trung',
  'Quảng Ngãi': 'Miền Trung',
  'Bình Định': 'Miền Trung',
  'Phú Yên': 'Miền Trung',
  'Ninh Thuận': 'Nam Bộ',
};

export const getAllProvinces = async (req, res) => {
  try {
    let provinces = await Province.find().sort({ name: 1 }).lean();

    if (provinces.length === 0) {
      provinces = provinceData.map((p) => ({
        code: p.id,
        name: p.name,
        slug: p.name,
        region: REGION_MAP[p.name] || '',
      }));
    }

    res.json(provinces);
  } catch (error) {
    console.error('❌ Lỗi lấy tỉnh:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

export const getProvinceByName = async (req, res) => {
  try {
    const province = await Province.findOne({ name: req.params.name }).lean();
    if (!province) {
      return res.status(404).json({ message: 'Không tìm thấy tỉnh' });
    }
    res.json(province);
  } catch (error) {
    console.error('❌ Lỗi lấy tỉnh:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

export const syncProvinces = async (req, res) => {
  try {
    const provinces = provinceData.map((p) => ({
      code: p.id,
      name: p.name,
      slug: p.name,
      region: REGION_MAP[p.name] || '',
    }));

    await Province.deleteMany({});
    await Province.insertMany(provinces);

    res.json({ count: provinces.length, provinces });
  } catch (error) {
    console.error('❌ Lỗi đồng bộ tỉnh:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};
