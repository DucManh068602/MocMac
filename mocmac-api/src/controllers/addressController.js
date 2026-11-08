import { User } from '../models/User.js';

export const listAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('addresses').lean();
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
    }
    const addresses = user.addresses || [];
    res.json({ addresses });
  } catch (error) {
    console.error('List addresses error:', error);
    res.status(500).json({ message: 'Không thể tải danh sách địa chỉ.' });
  }
};

export const createAddress = async (req, res) => {
  try {
    const {
      fullName,
      phone,
      provinceCode,
      provinceName,
      districtCode,
      districtName,
      wardCode,
      wardName,
      streetAddress,
      isDefault,
    } = req.body || {};

    if (!fullName || !phone || !provinceCode || !wardCode || !streetAddress) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin địa chỉ.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
    }

    // Nếu đặt làm mặc định, bỏ mặc định các địa chỉ khác
    if (isDefault) {
      user.addresses.forEach((a) => { a.isDefault = false; });
    } else if (user.addresses.length === 0) {
      // Nếu user chưa có địa chỉ nào, set làm mặc định
    }

    const newAddress = {
      fullName,
      phone,
      provinceCode: Number(provinceCode) || 0,
      provinceName: provinceName || '',
      districtCode: Number(districtCode) || 0,
      districtName: districtName || '',
      wardCode: Number(wardCode) || 0,
      wardName: wardName || '',
      streetAddress,
      isDefault: isDefault === true || user.addresses.length === 0,
    };

    user.addresses.push(newAddress);
    await user.save();

    const savedAddress = user.addresses[user.addresses.length - 1];
    res.status(201).json({ success: true, address: savedAddress, message: 'Đã thêm địa chỉ.' });
  } catch (error) {
    console.error('Create address error:', error);
    res.status(500).json({ message: 'Không thể thêm địa chỉ.' });
  }
};

export const updateAddress = async (req, res) => {
  try {
    const {
      fullName,
      phone,
      provinceCode,
      provinceName,
      districtCode,
      districtName,
      wardCode,
      wardName,
      streetAddress,
      isDefault,
    } = req.body || {};

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
    }

    const address = user.addresses.id(req.params.id);
    if (!address) {
      return res.status(404).json({ message: 'Không tìm thấy địa chỉ.' });
    }

    if (isDefault) {
      user.addresses.forEach((a) => { a.isDefault = false; });
      address.isDefault = true;
    }

    address.fullName = fullName || address.fullName;
    address.phone = phone || address.phone;
    address.provinceCode = Number(provinceCode) || address.provinceCode;
    address.provinceName = provinceName || address.provinceName;
    address.districtCode = Number(districtCode) || address.districtCode;
    address.districtName = districtName || address.districtName;
    address.wardCode = Number(wardCode) || address.wardCode;
    address.wardName = wardName || address.wardName;
    address.streetAddress = streetAddress || address.streetAddress;

    await user.save();
    res.json({ success: true, address, message: 'Đã cập nhật địa chỉ.' });
  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({ message: 'Không thể cập nhật địa chỉ.' });
  }
};

export const deleteAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
    }

    const address = user.addresses.id(req.params.id);
    if (!address) {
      return res.status(404).json({ message: 'Không tìm thấy địa chỉ.' });
    }

    const wasDefault = address.isDefault;
    user.addresses.pull(req.params.id);
    await user.save();

    // Nếu xóa địa chỉ mặc định, set địa chỉ còn lại làm mặc định
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
      await user.save();
    }

    res.json({ success: true, message: 'Đã xóa địa chỉ.' });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({ message: 'Không thể xóa địa chỉ.' });
  }
};

export const setDefaultAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
    }

    user.addresses.forEach((a) => { a.isDefault = false; });
    const address = user.addresses.id(req.params.id);
    if (!address) {
      return res.status(404).json({ message: 'Không tìm thấy địa chỉ.' });
    }
    address.isDefault = true;

    await user.save();
    res.json({ success: true, address, message: 'Đã đặt địa chỉ mặc định.' });
  } catch (error) {
    console.error('Set default address error:', error);
    res.status(500).json({ message: 'Không thể đặt địa chỉ mặc định.' });
  }
};
