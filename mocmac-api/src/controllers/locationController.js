const BASE_URL = 'https://provinces.open-api.vn/api/v2';

export const getProvinces = async (_req, res) => {
  try {
    const response = await fetch(`${BASE_URL}/p/`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Get provinces error:', error);
    res.status(500).json({ message: 'Không thể lấy danh sách tỉnh thành.' });
  }
};

export const getDistricts = async (req, res) => {
  try {
    const { code } = req.params;
    console.log('Get districts for code:', code, typeof code);
    // v2 API: lấy chi tiết tỉnh với depth=2 để có wards
    const response = await fetch(`${BASE_URL}/p/${code}?depth=2`);
    const data = await response.json();
    res.json(data.wards || []);
  } catch (error) {
    console.error('Get districts error:', error);
    res.status(500).json({ message: 'Không thể lấy danh sách phường xã.' });
  }
};

export const getWards = async (req, res) => {
  try {
    const { code } = req.params;
    const provinceCode = Number(code);
    console.log('Get wards for provinceCode:', code, typeof code, '->', provinceCode);
    if (!provinceCode || provinceCode <= 0) {
      return res.status(400).json({ message: 'Mã tỉnh không hợp lệ.' });
    }
    // v2 API: wards trực thuộc province_code
    const response = await fetch(`${BASE_URL}/w/?province=${provinceCode}`);
    const data = await response.json();
    console.log('Wards count:', Array.isArray(data) ? data.length : 0);
    res.json(data);
  } catch (error) {
    console.error('Get wards error:', error);
    res.status(500).json({ message: 'Không thể lấy danh sách phường xã.' });
  }
};
