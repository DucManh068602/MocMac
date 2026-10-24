import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import route from './routes/route.js';

const app = express();
app.use(morgan('dev'));

const PORT = process.env.PORT || 3000;

app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());
app.use('/api', route);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Lỗi máy chủ' });
});

await mongoose.connect(process.env.MONGODB_URI);
console.log('Đã kết nối MongoDB');

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.FRONTEND_URL, methods: ['GET', 'POST'] },
});

const userSocketMap = new Map();

io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (!token) return next(new Error('Vui lòng đăng nhập'));
  try {
    const payload = jwt.verify(String(token), process.env.JWT_SECRET);
    socket.data.userId = payload.sub;
    socket.data.role = payload.role;
    next();
  } catch (err) {
    next(new Error('Token không hợp lệ'));
  }
});

io.on('connection', (socket) => {
  const userId = socket.data.userId;
  if (userId) userSocketMap.set(String(userId), socket.id);

  socket.on('disconnect', () => {
    if (userId) userSocketMap.delete(String(userId));
  });
});

export { io, userSocketMap };

httpServer.listen(PORT, () => console.log(`API chạy tại http://localhost:${PORT}`));
