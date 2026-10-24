import { Router } from 'express';
import authRoutes from './auth.js';
import productRoutes from './products.js';
import contactRoutes from './contacts.js';
import orderRoutes from './orders.js';
import regionRoutes from './regions.js';
import couponRoutes from './coupons.js';
import paymentRoutes from './payments.js';
import notificationRoutes from './notifications.js';
import userRoutes from './users.js';
import chatRoutes from './chat.js';
import reviewRoutes from './reviews.js';
import auditRoutes from './auditRoutes.js';

const route = Router();

route.use('/auth', authRoutes);
route.use('/products', productRoutes);
route.use('/contacts', contactRoutes);
route.use('/orders', orderRoutes);
route.use('/regions', regionRoutes);
route.use('/coupons', couponRoutes);
route.use('/payments', paymentRoutes);
route.use('/notifications', notificationRoutes);
route.use('/users', userRoutes);
route.use('/reviews', reviewRoutes);
route.use('/chat', chatRoutes);
route.use('/audit-logs', auditRoutes);

export default route;
