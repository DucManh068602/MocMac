// impprt thư viện từ kho thư viện (node_modules)
import 'dotenv/config';
import express from 'express'; // thư viện express 
import cors from 'cors'; // thư viện cors (cho phép truy cập tới api)
import mongoose from 'mongoose';
import morgan from 'morgan'; // 1. Import morgan
import route from './routes/route.js';
//
const app = express(); // khởi tạo ứng dụng server
app.use(morgan('dev'));
// 2. Sử dụng morgan
// 'dev': Log ngắn gọn có màu sắc cho môi trường phát triển (VD: GET /api/products 200 15.021 ms - 45)
// 'combined': Log chi tiết chuẩn Apache cho môi trường Production
const PORT = process.env.PORT || 3000; // biến lưu trữ giá trị cổng, nếu không có thì lấy giá trị 3000


app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());
app.use('/api', route);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Lỗi máy chủ' });
});

await mongoose.connect(process.env.MONGODB_URI);
console.log('Đã kết nối MongoDB');

app.listen(PORT, () => console.log(`API chạy tại http://localhost:${PORT}`));
